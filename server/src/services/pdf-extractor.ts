import * as pdfParse from "pdf-parse";

export interface PdfExtractionResult {
  text: string;
  numPages: number;
  info?: Record<string, unknown>;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
  try {
    // pdf-parse is a CommonJS module, needs special handling
    const parse = (pdfParse as any).default || pdfParse;
    const data = await parse(buffer);

    return {
      text: data.text.trim(),
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validatePdfBuffer(buffer: Buffer, maxSizeBytes: number = 20 * 1024 * 1024): void {
  if (!buffer || buffer.length === 0) {
    throw new Error("PDF buffer is empty");
  }

  if (buffer.length > maxSizeBytes) {
    const maxSizeMB = maxSizeBytes / (1024 * 1024);
    throw new Error(`PDF file too large. Maximum size: ${maxSizeMB}MB`);
  }

  // Check for PDF signature (%PDF)
  const pdfSignature = buffer.toString("utf-8", 0, 4);
  if (pdfSignature !== "%PDF") {
    throw new Error("Invalid PDF file format");
  }
}
