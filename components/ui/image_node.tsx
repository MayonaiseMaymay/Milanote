"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface ImageInstance {
  id: string;
  x: number;
  y: number;
  src: string;
  width: number;
  height: number;
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
    // Synchronisiert den globalen Löschmodus
    const handleTrashSync = (e: Event) => {
      setIsTrashMode((e as CustomEvent).detail.isTrashMode);
    };
    window.addEventListener("milanote-trash-sync", handleTrashSync);

    // Klick auf "Add image" in der Sidebar abfangen
    const handleSidebarClicks = (e: MouseEvent) => {
      const aside = document.querySelector("aside");
      if (!aside || !aside.contains(e.target as Node)) return;

      const container = (e.target as HTMLElement).closest(".cursor-pointer");
      if (container && container.textContent?.includes("Add image")) {
        e.preventDefault();
        e.stopPropagation();
        if (!isTrashModeRef.current) {
          // Öffnet unsichtbar den Datei-Dialog des Browsers
          fileInputRef.current?.click();
        }
      }
    };

    window.addEventListener("click", handleSidebarClicks, true);
    return () => {
      window.removeEventListener("click", handleSidebarClicks, true);
      window.removeEventListener("milanote-trash-sync", handleTrashSync);
    };
  }, []);

  // Wenn der Nutzer ein Bild ausgewählt hat
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Erstellt eine lokale URL für das Bild (Browser-Preview ohne Backend!)
    const objectUrl = URL.createObjectURL(file);

    const count = imagesRef.current.length;
    const offset = (count * 30) % 150;

    const newImage: ImageInstance = {
      id: crypto.randomUUID(),
      x: 150 + offset,
      y: 150 + offset,
      src: objectUrl,
      width: 250, // Startgröße
      height: 250,
    };

    setImages((prev) => [...prev, newImage]);

    // Input zurücksetzen, damit das gleiche Bild nochmal gewählt werden kann
    if (fileInputRef.current) fileInputRef.current.value = "";
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
}: {
  image: ImageInstance;
  isTrashMode: boolean;
  onDeleteMe: () => void;
}) {
  const [position, setPosition] = useState({ x: image.x, y: image.y });
  const [size, setSize] = useState({
    width: image.width,
    height: image.height,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  // Dragging
  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTrashMode) return;
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

  // Resizing
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

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || !resizeRef.current) return;
    // Bewahrt optional die Form, hier für Flexibilität frei skalierbar
    setSize({
      width: Math.max(
        100,
        resizeRef.current.startW + (e.clientX - resizeRef.current.startX),
      ),
      height: Math.max(
        100,
        resizeRef.current.startH + (e.clientY - resizeRef.current.startY),
      ),
    });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    resizeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCardClick = () => {
    if (isTrashMode) {
      window.dispatchEvent(
        new CustomEvent("milanote-request-delete", {
          detail: { title: "Bild", onConfirm: onDeleteMe },
        }),
      );
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        zIndex: isDragging || isResizing ? 50 : 10,
      }}
      className={`rounded-lg overflow-hidden shadow-xl transition-all group/image animate-spawn-card
        ${isTrashMode ? "border-2 border-red-500 animate-shake cursor-pointer" : "border border-transparent hover:border-gray-600 cursor-grab active:cursor-grabbing"}
      `}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onClick={handleCardClick}
    >
      {isTrashMode && (
        <div className="absolute inset-0 bg-red-500/20 z-20 flex items-center justify-center opacity-100 backdrop-blur-[0.5px] transition-opacity">
          <div className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-lg">
            <Trash2 className="w-3.5 h-3.5" /> Bild löschen
          </div>
        </div>
      )}

      {/* Das Bild selbst */}
      <img
        src={image.src}
        alt="Uploaded Node"
        className="w-full h-full object-cover pointer-events-none"
      />

      {/* Resize Handle unten rechts */}
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
  );
}
