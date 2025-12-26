"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  sendSignalingMessage,
  receiveSignalingMessages,
  clearSignalingRoom,
  SignalingMessage,
} from "@/lib/webrtc-signaling";

// =============================================================================
// 型定義
// =============================================================================

export interface VideoCallDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログを閉じる */
  onClose: () => void;
  /** 通話相手の名前 */
  participantName?: string;
  /** ジョブID */
  jobId?: string;
  /** カスタムクラス名 */
  className?: string;
}

// =============================================================================
// コンポーネント
// =============================================================================

/**
 * ビデオ通話ダイアログコンポーネント
 *
 * 機能:
 * - WebRTCを使用したリアルタイムビデオ通話
 * - カメラ・マイクのON/OFF切り替え
 * - 通話終了
 * - 接続状態の表示
 *
 * 実装:
 * - WebRTC PeerConnectionを使用したリアルタイムビデオ通話
 * - HTTP API経由のシグナリング（ポーリング方式）
 * - STUNサーバーを使用したNAT越え
 */
export function VideoCallDialog({
  open,
  onClose,
  participantName = "顧客",
  jobId,
  className,
}: VideoCallDialogProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const signalingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string>(`user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
  const roomIdRef = useRef<string>(jobId ? `room-${jobId}` : `room-${Date.now()}`);

  /**
   * カメラ・マイクのストリームを取得
   */
  const getLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled,
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play();
      }

      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("メディアストリーム取得エラー:", error);
      toast.error("カメラまたはマイクへのアクセスに失敗しました");
      setConnectionError("カメラまたはマイクへのアクセスに失敗しました");
      return null;
    }
  };

  /**
   * カメラ・マイクのストリームを停止
   */
  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  /**
   * WebRTC PeerConnectionを初期化
   */
  const initializePeerConnection = useCallback(() => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // ICE候補の処理
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignalingMessage(roomIdRef.current, userIdRef.current, {
          type: "ice-candidate",
          data: event.candidate.toJSON(),
        }).catch((error) => {
          console.error("ICE候補の送信エラー:", error);
        });
      }
    };

    // リモートストリームの処理
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play();
      }
    };

    // 接続状態の変更
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("[WebRTC] 接続状態:", state);
      
      if (state === "connected") {
        setIsConnected(true);
        setIsConnecting(false);
        toast.success("通話を開始しました");
      } else if (state === "disconnected" || state === "failed") {
        setIsConnected(false);
        setConnectionError("接続が切断されました");
        toast.error("接続が切断されました");
      }
    };

    return pc;
  }, []);

  /**
   * シグナリングメッセージを処理
   */
  const handleSignalingMessage = useCallback(
    async (message: SignalingMessage) => {
      if (!peerConnectionRef.current) return;

      const pc = peerConnectionRef.current;

      try {
        switch (message.type) {
          case "offer":
            await pc.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await sendSignalingMessage(roomIdRef.current, userIdRef.current, {
              type: "answer",
              data: answer,
            });
            break;

          case "answer":
            await pc.setRemoteDescription(new RTCSessionDescription(message.data as RTCSessionDescriptionInit));
            break;

          case "ice-candidate":
            if (message.data) {
              await pc.addIceCandidate(new RTCIceCandidate(message.data as RTCIceCandidateInit));
            }
            break;

          case "hangup":
            handleEndCall();
            break;
        }
      } catch (error) {
        console.error("[WebRTC] シグナリングメッセージ処理エラー:", error);
      }
    },
    []
  );

  /**
   * シグナリングメッセージをポーリング
   */
  const startSignalingPolling = useCallback(() => {
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
    }

    signalingIntervalRef.current = setInterval(async () => {
      try {
        const messages = await receiveSignalingMessages(roomIdRef.current, userIdRef.current);
        for (const message of messages) {
          if (message.from !== userIdRef.current) {
            await handleSignalingMessage(message);
          }
        }
      } catch (error) {
        console.error("[WebRTC] シグナリングポーリングエラー:", error);
      }
    }, 1000); // 1秒ごとにポーリング
  }, [handleSignalingMessage]);

  /**
   * 通話を開始
   */
  const handleStartCall = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      // ローカルストリームを取得
      const stream = await getLocalStream();
      if (!stream) {
        setIsConnecting(false);
        return;
      }

      // PeerConnectionを初期化
      const pc = initializePeerConnection();

      // ローカルストリームをPeerConnectionに追加
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // オファーを作成して送信
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendSignalingMessage(roomIdRef.current, userIdRef.current, {
        type: "offer",
        data: offer,
      });

      // シグナリングポーリングを開始
      startSignalingPolling();

      // 接続状態を更新（実際の接続は非同期で行われる）
      setIsConnecting(false);
    } catch (error) {
      console.error("通話開始エラー:", error);
      toast.error("通話の開始に失敗しました");
      setConnectionError("通話の開始に失敗しました");
      setIsConnecting(false);
    }
  }, [initializePeerConnection, startSignalingPolling, getLocalStream]);

  /**
   * 通話を終了
   */
  const handleEndCall = useCallback(() => {
    // シグナリングポーリングを停止
    if (signalingIntervalRef.current) {
      clearInterval(signalingIntervalRef.current);
      signalingIntervalRef.current = null;
    }

    // ハングアップメッセージを送信
    sendSignalingMessage(roomIdRef.current, userIdRef.current, {
      type: "hangup",
    }).catch((error) => {
      console.error("ハングアップメッセージの送信エラー:", error);
    });

    stopLocalStream();

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // ルームをクリア
    clearSignalingRoom(roomIdRef.current).catch((error) => {
      console.error("ルームのクリアエラー:", error);
    });

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
    onClose();
    toast.info("通話を終了しました");
  }, [onClose]);

  /**
   * カメラのON/OFF切り替え
   */
  const handleToggleVideo = async () => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !isVideoEnabled;
    });

    setIsVideoEnabled(!isVideoEnabled);
    toast.info(isVideoEnabled ? "カメラをOFFにしました" : "カメラをONにしました");
  };

  /**
   * マイクのON/OFF切り替え
   */
  const handleToggleAudio = async () => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !isAudioEnabled;
    });

    setIsAudioEnabled(!isAudioEnabled);
    toast.info(isAudioEnabled ? "マイクをOFFにしました" : "マイクをONにしました");
  };

  // ダイアログが開いたときにストリームを取得
  useEffect(() => {
    if (open && !isConnected && !isConnecting) {
      handleStartCall();
    }

    // クリーンアップ
    return () => {
      if (!open) {
        stopLocalStream();
        // シグナリングポーリングを停止
        if (signalingIntervalRef.current) {
          clearInterval(signalingIntervalRef.current);
          signalingIntervalRef.current = null;
        }
      }
    };
  }, [open, isConnected, isConnecting, handleStartCall]);

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      // シグナリングポーリングを停止
      if (signalingIntervalRef.current) {
        clearInterval(signalingIntervalRef.current);
        signalingIntervalRef.current = null;
      }

      stopLocalStream();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // ルームをクリア
      clearSignalingRoom(roomIdRef.current).catch((error) => {
        console.error("ルームのクリアエラー:", error);
      });
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-4xl w-full p-0", className)}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <span>ビデオ通話</span>
            {isConnected && (
              <Badge variant="default" className="bg-green-500">
                接続中
              </Badge>
            )}
            {isConnecting && (
              <Badge variant="secondary">接続中...</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {participantName}様とのビデオ通話
            {jobId && ` (Job ID: ${jobId})`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-slate-900 aspect-video rounded-lg overflow-hidden">
          {/* リモートビデオ（相手の映像） */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
          />

          {/* ローカルビデオ（自分の映像） */}
          <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>

          {/* 接続エラー表示 */}
          {connectionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="text-center text-white">
                <p className="text-lg font-medium mb-2">接続エラー</p>
                <p className="text-base text-slate-300">{connectionError}</p>
              </div>
            </div>
          )}

          {/* 接続中表示 */}
          {isConnecting && !connectionError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p className="text-lg font-medium">接続中...</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleVideo}
              disabled={!isConnected || isConnecting}
              className={cn(
                isVideoEnabled ? "bg-slate-100" : "bg-red-100 text-red-700"
              )}
            >
              {isVideoEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleAudio}
              disabled={!isConnected || isConnecting}
              className={cn(
                isAudioEnabled ? "bg-slate-100" : "bg-red-100 text-red-700"
              )}
            >
              {isAudioEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>
          </div>

          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="gap-2"
          >
            <PhoneOff className="h-5 w-5" />
            通話を終了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









