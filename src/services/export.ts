import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { TranscriptSegment } from "../types";

export class PDFExportService {
  public static async exportToPDF(transcript: TranscriptSegment[], summary: string): Promise<Blob> {
    const pdfDoc = await PDFDocument.create();
    
    // Embed standard fonts
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);

    let page = pdfDoc.addPage();
    let { width, height } = page.getSize();
    let currentY = height - 50;
    const margin = 50;

    // Helper to add new page if needed
    const checkPageBreak = (spaceNeeded: number) => {
      if (currentY - spaceNeeded < margin) {
        page = pdfDoc.addPage();
        currentY = height - 50;
      }
    };

    // 1. Title Page / Header
    page.drawText("Meeting Summary & Transcript", {
      x: margin,
      y: currentY,
      size: 24,
      font: timesRomanBoldFont,
      color: rgb(0, 0, 0),
    });
    currentY -= 30;

    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: timesRomanFont,
    });
    currentY -= 40;

    // 2. Summary Section
    if (summary) {
      page.drawText("Summary:", {
        x: margin,
        y: currentY,
        size: 16,
        font: timesRomanBoldFont,
      });
      currentY -= 25;

      const lines = summary.split('\n');
      for (const line of lines) {
        checkPageBreak(20);
        page.drawText(line.substring(0, 80), { // crude line wrap for MVP
          x: margin + 10,
          y: currentY,
          size: 11,
          font: timesRomanFont,
        });
        currentY -= 15;
      }
      currentY -= 20;
    }

    // 3. Transcript Section
    checkPageBreak(40);
    page.drawText("Full Transcript:", {
      x: margin,
      y: currentY,
      size: 16,
      font: timesRomanBoldFont,
    });
    currentY -= 25;

    for (const segment of transcript) {
      checkPageBreak(30);
      
      const timeStr = `[${new Date(segment.timestamp.start).toISOString().substr(11, 8)}]`;
      const speakerStr = `${segment.speaker}: `;
      
      page.drawText(`${timeStr} ${speakerStr}`, {
        x: margin,
        y: currentY,
        size: 10,
        font: timesRomanBoldFont,
      });
      
      currentY -= 12;
      
      // Simple word wrap
      const words = segment.text.split(' ');
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + word).length > 80) {
          checkPageBreak(15);
          page.drawText(currentLine, {
            x: margin + 20,
            y: currentY,
            size: 10,
            font: courierFont,
          });
          currentY -= 12;
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      }
      
      if (currentLine) {
        checkPageBreak(15);
        page.drawText(currentLine, {
          x: margin + 20,
          y: currentY,
          size: 10,
          font: courierFont,
        });
        currentY -= 20; // Extra spacing between segments
      }
    }

    // Generate blob
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes], { type: "application/pdf" });
  }

  public static downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
