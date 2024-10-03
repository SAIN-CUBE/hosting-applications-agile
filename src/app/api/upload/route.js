import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
import { createCanvas } from "canvas"; // Import createCanvas from canvas

export const POST = async (req) => {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const pdfImages = await convertPdfToImages(fileBuffer);

    // For demo purposes, return the image URLs (base64 PNGs)
    return NextResponse.json({ images: pdfImages });
  } catch (error) {
    console.error("PDF processing error:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
};

async function convertPdfToImages(pdfBuffer) {
  const pdfImages = [];

  // Convert Buffer to Uint8Array
  const uint8Array = new Uint8Array(pdfBuffer);

  // Load the PDF document
  const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    // Use the canvas package to create a canvas
    const canvas = createCanvas(viewport.width, viewport.height);
    const context = canvas.getContext("2d");

    const renderContext = {
      canvasContext: context,
      viewport,
    };

    // Render the page into the canvas context
    await page.render(renderContext).promise;

    // Convert the canvas to a PNG image and get the data URL
    const imageDataUrl = canvas.toDataURL("image/png");
    pdfImages.push(imageDataUrl);
  }

  return pdfImages;
}
