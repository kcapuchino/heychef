import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

function cleanExtractedText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: Request) {
  let parser: PDFParse | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No recipe file was provided.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "The selected file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "Recipe files must be smaller than 8 MB.",
        },
        {
          status: 413,
        }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({
        buffer,
      });

      extractedText = result.value || "";
    } else if (fileName.endsWith(".pdf")) {
      parser = new PDFParse({
        data: buffer,
      });

      const result = await parser.getText();

      extractedText = result.text || "";
    } else if (fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        {
          error:
            "This file type is not supported. Upload a DOCX, PDF, or TXT file.",
        },
        {
          status: 415,
        }
      );
    }

    const cleanedText = cleanExtractedText(extractedText);

    if (!cleanedText) {
      return NextResponse.json(
        {
          error:
            "No readable text was found. This may be a scanned or handwritten PDF.",
        },
        {
          status: 422,
        }
      );
    }

    return NextResponse.json(
      {
        text: cleanedText,
        fileName: file.name,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Recipe file extraction error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unknown recipe file error";

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Could not read this file: ${message}`
            : "Hey Chef could not read this file. Try a DOCX, typed PDF, or TXT file.",
      },
      {
        status: 500,
      }
    );
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (destroyError) {
        console.error(
          "Could not destroy PDF parser:",
          destroyError
        );
      }
    }
  }
}