"use client";

import { ZohoJob } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KanbanCard } from "./kanban-card";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { KanbanColumnType } from "@/lib/kanban-utils";

interface KanbanColumnProps {
  columnId: KanbanColumnType;
  title: string;
  jobs: ZohoJob[];
  count: number;
}

/**
 * ドラッグ可能なカンバンカードコンポーネント
 */
function DraggableKanbanCard({ job }: { job: ZohoJob }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <KanbanCard job={job} isDragging={isDragging} />
    </div>
  );
}

/**
 * カンバンボード列コンポーネント
 */
export function KanbanColumn({ columnId, title, jobs, count }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  return (
    <div className="flex-1 min-w-0">
      <Card className="border border-slate-300 rounded-xl shadow-md h-full flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-xl font-bold text-slate-900">
            <span>{title}</span>
            <span className="text-base font-semibold text-slate-600">
              {count}台
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent
          ref={setNodeRef}
          className={cn(
            "flex-1 overflow-y-auto space-y-3 min-h-[400px]",
            isOver && "bg-slate-50"
          )}
        >
          {jobs.length === 0 ? (
            <div className="text-center text-base text-slate-500 py-8">
              案件がありません
            </div>
          ) : (
            jobs.map((job) => (
              <DraggableKanbanCard key={job.id} job={job} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

