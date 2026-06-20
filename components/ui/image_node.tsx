"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Trash2,
  Copy,
  Crop,
  ArrowUpToLine,
  ArrowDownToLine,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Das neue Crop-Tool importieren
import ReactCrop, { type Crop as CropType } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageInstance {
  id: string;
  x: number;
  y: number;
  src: string;
  width: number;
  height: number;
  zIndex?: number;
}

// ==========================================
// 1. DER BILD-MANAGER
// ==========================================
export default function ImageNodeManager() {
  const [images, setImages] = useState<ImageInstance[]>([]);
  const [isTrashMode, setIsTrashMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagesRef = useRef(images);
  const isTrashModeRef = useRef(isTrashMode);

  useEffect(() => {
    imagesRef.current = images;
    isTrashModeRef.current = isTrashMode;
  }, [images, isTrashMode]);

  useEffect(() => {
    const handleTrashSync = (e: Event) =>
      setIsTrashMode((e as CustomEvent).detail.isTrashMode);
    window.addEventListener("milanote-trash-sync", handleTrashSync);

    const handleSidebarClicks = (e: MouseEvent) => {
      const aside = document.querySelector("aside");
      if (!aside || !aside.contains(e.target as Node)) return;

      const container = (e.target as HTMLElement).closest(".cursor-pointer");
      if (container && container.textContent?.includes("Add image")) {
        e.preventDefault();
        e.stopPropagation();
        if (!isTrashModeRef.current) fileInputRef.current?.click();
      }
    };

    window.addEventListener("click", handleSidebarClicks, true);
    return () => {
      window.removeEventListener("click", handleSidebarClicks, true);
      window.removeEventListener("milanote-trash-sync", handleTrashSync);
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);

    // Bild kurz unsichtbar laden, um echte Maße zu erhalten
    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;
      const maxSize = 300;

      if (width > height && width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }

      const count = imagesRef.current.length;
      const offset = (count * 30) % 150;

      const newImage: ImageInstance = {
        id: crypto.randomUUID(),
        x: 150 + offset,
        y: 150 + offset,
        src: objectUrl,
        width,
        height,
        zIndex: 10,
      };

      setImages((prev) => [...prev, newImage]);
    };
    img.src = objectUrl;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDuplicate = (img: ImageInstance) => {
    setImages((prev) => [
      ...prev,
      {
        ...img,
        id: crypto.randomUUID(),
        x: img.x + 30,
        y: img.y + 30,
        zIndex: (img.zIndex || 10) + 1,
      },
    ]);
  };

  const handleUpdateImage = (updatedImg: ImageInstance) => {
    setImages((prev) =>
      prev.map((img) => (img.id === updatedImg.id ? updatedImg : img)),
    );
  };

  return (
    <>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Bild hochladen"
        title="Bild hochladen"
      />
      {images.map((img) => (
        <IndividualImageNode
          key={img.id}
          image={img}
          isTrashMode={isTrashMode}
          onDeleteMe={() =>
            setImages((prev) => prev.filter((i) => i.id !== img.id))
          }
          onDuplicate={() => handleDuplicate(img)}
          onUpdateImage={handleUpdateImage}
        />
      ))}
    </>
  );
}

// ==========================================
// 2. DAS EINZELNE BILD-NODE
// ==========================================
function IndividualImageNode({
  image,
  isTrashMode,
  onDeleteMe,
  onDuplicate,
  onUpdateImage,
}: {
  image: ImageInstance;
  isTrashMode: boolean;
  onDeleteMe: () => void;
  onDuplicate: () => void;
  onUpdateImage: (img: ImageInstance) => void;
}) {
  const [position, setPosition] = useState({ x: image.x, y: image.y });
  const [size, setSize] = useState({
    width: image.width,
    height: image.height,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const [zIndex, setZIndex] = useState(image.zIndex || 10);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
  }>({ show: false, x: 0, y: 0 });

  // --- CROP STATES ---
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<CropType>();
  const imgRef = useRef<HTMLImageElement>(null);

  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = () =>
      setContextMenu((prev) => ({ ...prev, show: false }));
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTrashMode || e.button !== 0) return;
    setContextMenu({ show: false, x: 0, y: 0 });
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragRef.current) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handleDragPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTrashMode) return;
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: size.width,
      startH: size.height,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // --- PERFEKTES SEITENVERHÄLTNIS BEIM SKALIEREN ---
  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || !resizeRef.current) return;

    const aspectRatio = image.width / image.height;
    const newWidth = Math.max(
      50,
      resizeRef.current.startW + (e.clientX - resizeRef.current.startX),
    );
    const newHeight = newWidth / aspectRatio; // Höhe passt sich automatisch an!

    setSize({ width: newWidth, height: newHeight });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    resizeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isTrashMode) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY });
  };

  // --- MAGIE: DAS BILD WIRD PHYSISCH ZUGESCHNITTEN ---
  const handleSaveCrop = () => {
    if (!imgRef.current || !crop || crop.width === 0 || crop.height === 0) {
      setIsCropping(false);
      return;
    }

    const canvas = document.createElement("canvas");
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Zeichnet genau den Ausschnitt aus dem Originalbild auf den unsichtbaren Canvas
    ctx.drawImage(
      imgRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY,
    );

    // Wandelt den Canvas in eine neue Bild-Datei um und speichert sie
    canvas.toBlob((blob) => {
      if (!blob) return;
      const newUrl = URL.createObjectURL(blob);

      const newWidth = size.width;
      const newHeight = size.width / (crop.width / crop.height); // Neues Seitenverhältnis anwenden

      onUpdateImage({
        ...image,
        src: newUrl,
        width: newWidth,
        height: newHeight,
      });
      setSize({ width: newWidth, height: newHeight });

      setIsCropping(false);
    }, "image/png");
  };

  const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    textClass = "text-gray-200",
  }: {
    icon: any;
    label: string;
    onClick: () => void;
    textClass?: string;
  }) => (
    <div
      className={`flex items-center gap-2 px-3 py-2 hover:bg-[#3a3a3a] cursor-pointer transition-colors ${textClass}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        setContextMenu({ show: false, x: 0, y: 0 });
      }}
    >
      <Icon className="w-4 h-4" /> <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex: isDragging || isResizing ? 50 : zIndex,
        }}
        className={`rounded-lg overflow-hidden shadow-xl transition-all group/image animate-spawn-card
          ${isTrashMode ? "border-2 border-red-500 animate-shake cursor-pointer" : "border border-transparent hover:border-gray-600 cursor-grab active:cursor-grabbing"}
        `}
        onPointerDown={handleDragPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
        onClick={() => {
          if (isTrashMode)
            window.dispatchEvent(
              new CustomEvent("milanote-request-delete", {
                detail: { title: "Bild", onConfirm: onDeleteMe },
              }),
            );
        }}
        onContextMenu={handleContextMenu}
      >
        {isTrashMode && (
          <div className="absolute inset-0 bg-red-500/20 z-20 flex items-center justify-center opacity-100 backdrop-blur-[0.5px] transition-opacity">
            <div className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-lg">
              <Trash2 className="w-3.5 h-3.5" /> Bild löschen
            </div>
          </div>
        )}

        <img
          src={image.src}
          alt="Uploaded Node"
          className="w-full h-full pointer-events-none object-cover"
        />

        {!isTrashMode && (
          <div
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-2 opacity-0 group-hover/image:opacity-100 transition-opacity bg-linear-to-tl from-black/40 to-transparent"
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
          >
            <div className="w-3 h-3 border-b-2 border-r-2 border-white/80 rounded-sm" />
          </div>
        )}
      </div>

      {contextMenu.show && (
        <div
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
          }}
          className="w-48 bg-[#2a2a2a] border border-[#383838] shadow-2xl rounded-md py-1 animate-spawn-card"
          onContextMenu={(e) => e.preventDefault()}
        >
          <MenuItem icon={Copy} label="Duplizieren" onClick={onDuplicate} />
          <div className="h-px bg-[#383838] my-1" />
          <MenuItem
            icon={Crop}
            label="Zuschneiden"
            onClick={() => {
              setIsCropping(true);
              setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
            }}
          />
          <MenuItem
            icon={ArrowUpToLine}
            label="Ebene nach vorn"
            onClick={() => setZIndex(zIndex + 1)}
          />
          <MenuItem
            icon={ArrowDownToLine}
            label="Ebene nach hinten"
            onClick={() => setZIndex(Math.max(0, zIndex - 1))}
          />
          <div className="h-px bg-[#383838] my-1" />
          <MenuItem
            icon={Trash2}
            label="Löschen"
            onClick={onDeleteMe}
            textClass="text-red-400 hover:text-red-300"
          />
        </div>
      )}

      {/* --- DER CROP DIALOG --- */}
      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-2xl bg-[#2a2a2a] border-[#383838] text-gray-200"
        >
          <DialogHeader>
            <DialogTitle>Bild zuschneiden</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-black/60 p-4 rounded-md min-h-[300px] overflow-auto">
            <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
              <img
                ref={imgRef}
                src={image.src}
                alt="Crop preview"
                className="max-h-[60vh] object-contain pointer-events-none"
              />
            </ReactCrop>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsCropping(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-white transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSaveCrop}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-sm text-white transition-colors"
            >
              Ausschnitt speichern
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
