import { useState, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Check, X } from "lucide-react";

type ImageCropperProps = {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
};

async function getCroppedImg(image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(pixelCrop.width * scaleX);
  canvas.height = Math.floor(pixelCrop.height * scaleY);

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas is empty"));
        return;
      }
      resolve(blob);
    }, "image/jpeg", 0.9);
  });
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Create an initial rectangle roughly 9:16 ratio to mimic a phone screen,
    // but keep it flexible so the user can drag handles freely.
    let cropWidth = width * 0.8;
    let cropHeight = cropWidth * (16 / 9);

    if (cropHeight > height * 0.8) {
      cropHeight = height * 0.8;
      cropWidth = cropHeight * (9 / 16);
    }

    const initialCrop: Crop = {
      unit: "px",
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };
    
    setCrop(initialCrop);
    setCompletedCrop(initialCrop as PixelCrop);
  };

  const handleConfirm = async () => {
    if (!completedCrop || !imgRef.current) return;
    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedBlob);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex-1 overflow-hidden flex items-center justify-center p-4">
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          className="max-h-full"
        >
          <img
            ref={imgRef}
            alt="Crop me"
            src={imageSrc}
            onLoad={onImageLoad}
            className="max-h-full max-w-full object-contain"
            style={{ maxHeight: "calc(100vh - 150px)" }}
          />
        </ReactCrop>
      </div>
      <div className="bg-black/90 pb-safe pt-4 px-6 flex justify-between items-center h-24 border-t border-white/10 shrink-0">
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform disabled:opacity-50"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="text-white/60 text-sm font-medium">Adjust Crop</div>
        <button
          onClick={handleConfirm}
          disabled={isProcessing}
          className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground active:scale-95 transition-transform disabled:opacity-50"
        >
          <Check className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
