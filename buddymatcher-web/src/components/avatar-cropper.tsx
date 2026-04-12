"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

type AvatarCropperText = {
  title: string;
  subtitle: string;
  zoomLabel: string;
  cancelLabel: string;
  applyLabel: string;
  failedLabel: string;
};

type AvatarCropperProps = {
  open: boolean;
  image: string | null;
  text: AvatarCropperText;
  onCancel: () => void;
  onApply: (croppedImageDataUrl: string) => void;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

async function cropImageToDataUrl(imageSrc: string, cropArea: Area) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context not available");
  }

  canvas.width = Math.max(1, Math.round(cropArea.width));
  canvas.height = Math.max(1, Math.round(cropArea.height));

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return canvas.toDataURL("image/jpeg", 0.92);
}

export function AvatarCropper({ open, image, text, onCancel, onApply }: AvatarCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1.2);
      setCroppedAreaPixels(null);
      setProcessing(false);
      setError("");
    }
  }, [open, image]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const applyCrop = useCallback(async () => {
    if (!image || !croppedAreaPixels) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const croppedImageDataUrl = await cropImageToDataUrl(image, croppedAreaPixels);
      onApply(croppedImageDataUrl);
    } catch {
      setError(text.failedLabel);
    } finally {
      setProcessing(false);
    }
  }, [croppedAreaPixels, image, onApply, text.failedLabel]);

  if (!open || !image) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="panel w-full max-w-xl p-5 sm:p-6">
        <h3 className="text-xl text-slate-900 sm:text-2xl">{text.title}</h3>
        <p className="muted mt-1 text-sm">{text.subtitle}</p>

        <div className="relative mt-4 h-72 w-full overflow-hidden rounded-xl border border-slate-200 bg-black">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-700">
            <span>{text.zoomLabel}</span>
            <span>{zoom.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-amber-600"
          />
        </div>

        {error ? <p className="status mt-3 text-sm">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost px-4 py-2" type="button" onClick={onCancel} disabled={processing}>
            {text.cancelLabel}
          </button>
          <button
            className="btn-primary px-4 py-2"
            type="button"
            onClick={() => void applyCrop()}
            disabled={processing || !croppedAreaPixels}
          >
            {processing ? "..." : text.applyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
