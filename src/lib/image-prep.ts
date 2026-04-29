import type { ScanMimeType } from "@/lib/scan";

export type PreparedScanImage = {
  imageBase64: string;
  mimeType: ScanMimeType;
  width: number;
  height: number;
  bytes: number;
};

type LoadedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

const MAX_SOURCE_BYTES = 14 * 1024 * 1024;
const MAX_DIMENSION = 768;
const JPEG_QUALITY = 0.65;

export async function prepareScanImage(file: File): Promise<PreparedScanImage> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a menu or dish image.");
  }

  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Image is too large. Choose a smaller photo.");
  }

  const image = await loadImage(file);
  const { width, height } = fitWithin(image.width, image.height, MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    image.close();
    throw new Error("Could not prepare image for scanning.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.filter = "grayscale(100%)";
  context.drawImage(image.source, 0, 0, width, height);
  image.close();

  const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
  const imageBase64 = await blobToBase64(blob);

  return {
    imageBase64,
    mimeType: "image/jpeg",
    width,
    height,
    bytes: blob.size,
  };
}

async function loadImage(file: File): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Fall through to the image element path for stricter mobile browsers.
    }
  }

  return loadImageElement(file);
}

function loadImageElement(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => URL.revokeObjectURL(url),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };
    image.src = url;
  });
}

function fitWithin(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: ScanMimeType,
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Could not compress image."));
      },
      type,
      quality
    );
  });
}

function blobToBase64(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not read compressed image."));
        return;
      }

      const [, base64] = reader.result.split(",");
      if (!base64) {
        reject(new Error("Could not encode compressed image."));
        return;
      }

      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read compressed image."));
    reader.readAsDataURL(blob);
  });
}
