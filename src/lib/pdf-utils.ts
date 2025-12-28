import { PDFDocument, PDFPage, PDFFont, rgb, RGB, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/**
 * Loads a custom font from a URL and embeds it into the PDF document.
 */
export async function loadCustomFont(
    doc: PDFDocument,
    url: string,
    fontName: string
): Promise<PDFFont | null> {
    try {
        doc.registerFontkit(fontkit);
        const fontBytes = await fetch(url).then((res) => res.arrayBuffer());
        const customFont = await doc.embedFont(fontBytes);
        return customFont;
    } catch (error) {
        console.error(`Failed to load custom font from ${url}:`, error);
        return null;
    }
}

/**
 * Helper to split text into lines that fit within a maximum width.
 * Accounts for font size and handles Japanese characters properly (roughly).
 */
export function splitTextToSize(
    text: string,
    font: PDFFont,
    fontSize: number,
    maxWidth: number
): string[] {
    if (!text) return [];

    const lines: string[] = [];
    const paragraphs = text.split("\n");

    for (const paragraph of paragraphs) {
        let currentLine = "";

        // Simple character-by-character wrap
        // For a more robust solution, we might want to use a line-breaker library,
        // but this suffices for many basic use cases.
        for (const char of paragraph) {
            const testLine = currentLine + char;
            const width = font.widthOfTextAtSize(testLine, fontSize);

            if (width > maxWidth) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
    }

    return lines;
}

/**
 * Converts mm to points (pdf-lib uses points by default, 72 dpi)
 * 1 mm = 2.83465 points
 */
export function mmToPt(mm: number): number {
    return mm * 2.83465;
}

/**
 * Draws text on the page using a top-left coordinate system (emulating jsPDF).
 * pdf-lib uses bottom-left origin by default.
 */
export function drawText(
    page: PDFPage,
    text: string,
    xMm: number,
    yMm: number,
    font: PDFFont,
    fontSize: number,
    color: RGB = rgb(0, 0, 0),
    options: { align?: "left" | "center" | "right" } = {}
) {
    const { height } = page.getSize();
    const x = mmToPt(xMm);
    // In pdf-lib, y is from bottom.
    // Converting top-left y (mm) to bottom-left y (pt).
    // Note: Text is drawn from the baseline. jsPDF usually draws from baseline too but
    // alignment might need adjustment.
    // Let's assume yMm is the baseline position from the top.
    const y = height - mmToPt(yMm);

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    let finalX = x;

    if (options.align === "center") {
        finalX = x - textWidth / 2;
    } else if (options.align === "right") {
        finalX = x - textWidth;
    }

    page.drawText(text, {
        x: finalX,
        y: y,
        size: fontSize,
        font: font,
        color: color,
    });
}

/**
 * Draws a line using top-left coordinates.
 */
export function drawLine(
    page: PDFPage,
    x1Mm: number,
    y1Mm: number,
    x2Mm: number,
    y2Mm: number,
    thickness: number = 0.5,
    color: RGB = rgb(0, 0, 0)
) {
    const { height } = page.getSize();
    page.drawLine({
        start: { x: mmToPt(x1Mm), y: height - mmToPt(y1Mm) },
        end: { x: mmToPt(x2Mm), y: height - mmToPt(y2Mm) },
        thickness: thickness,
        color: color,
    });
}

/**
 * Draws a rectangle using top-left coordinates.
 */
export function drawRect(
    page: PDFPage,
    xMm: number,
    yMm: number,
    widthMm: number,
    heightMm: number,
    options: {
        borderColor?: RGB;
        fillColor?: RGB;
        borderWidth?: number;
    } = {}
) {
    const { height } = page.getSize();
    // rect in pdf-lib is defined by bottom-left corner, width, and height.
    // xMm, yMm is top-left corner.
    // So bottom-left y is: height - (yMm + heightMm) * conversion

    // Correction: 
    // top-left y in pt = height - mmToPt(yMm)
    // bottom-left y in pt = height - mmToPt(yMm) - mmToPt(heightMm)

    const rectOptions: any = {
        x: mmToPt(xMm),
        y: height - mmToPt(yMm + heightMm),
        width: mmToPt(widthMm),
        height: mmToPt(heightMm),
    };

    if (options.borderColor) {
        rectOptions.borderColor = options.borderColor;
        rectOptions.borderWidth = options.borderWidth || 1;
    } else {
        rectOptions.borderWidth = 0;
    }

    if (options.fillColor) {
        rectOptions.color = options.fillColor; // Helper property for fill color
        // If we want both stroke and fill, pdf-lib `drawRectangle` takes `color` (fill) and `borderColor`.
    }

    page.drawRectangle(rectOptions);
}
