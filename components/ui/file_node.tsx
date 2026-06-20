"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2, File as FileIcon, Download } from "lucide-react";

interface FileInstance {
  id: string;
  x: number;
  y: number;
  name: string;
  size: string;
  type: string;
  url: string; // <-- NEU: Hier speichern wir die temporäre Download-URL
}

// ==========================================
// 1. DER DATEI-MANAGER
// ==========================================
export default function FileNodeManager() {
  const [files, setFiles] = useState<FileInstance[]>([]);
  const [isTrashMode, setIsTrashMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filesRef = useRef(files);
  const isTrashModeRef = useRef(isTrashMode);

  useEffect(() => {
    filesRef.current = files;
    isTrashModeRef.current = isTrashMode;
  }, [files, isTrashMode]);

  useEffect(() => {
    const handleTrashSync = (e: Event) =>
      setIsTrashMode((e as CustomEvent).detail.isTrashMode);
    window.addEventListener("milanote-trash-sync", handleTrashSync);

    const handleSidebarClicks = (e: MouseEvent) => {
      const aside = document.querySelector("aside");
      if (!aside || !aside.contains(e.target as Node)) return;

      const container = (e.target as HTMLElement).closest(".cursor-pointer");
      if (container && container.textContent?.includes("Upload")) {
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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Erstellt eine lokale URL für die Datei, damit sie heruntergeladen werden kann
    const objectUrl = URL.createObjectURL(selectedFile);

    const count = filesRef.current.length;
    const offset = (count * 30) % 150;

    const newFile: FileInstance = {
      id: crypto.randomUUID(),
      x: 200 + offset,
      y: 200 + offset,
      name: selectedFile.name,
      size: formatBytes(selectedFile.size),
      type: selectedFile.type,
      url: objectUrl, // Speichert die URL im Objekt
    };

    setFiles((prev) => [...prev, newFile]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Datei hochladen"
        title="Datei hochladen"
      />
      {files.map((file) => (
        <IndividualFileNode
          key={file.id}
          file={file}
          isTrashMode={isTrashMode}
          onDeleteMe={() =>
            setFiles((prev) => prev.filter((f) => f.id !== file.id))
          }
        />
      ))}
    </>
  );
}

// ==========================================
// 2. DAS EINZELNE DATEI-NODE
// ==========================================
function IndividualFileNode({
  file,
  isTrashMode,
  onDeleteMe,
}: {
  file: FileInstance;
  isTrashMode: boolean;
  onDeleteMe: () => void;
}) {
  const [position, setPosition] = useState({ x: file.x, y: file.y });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isTrashMode) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragRef.current) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleCardClick = () => {
    if (isTrashMode) {
      window.dispatchEvent(
        new CustomEvent("milanote-request-delete", {
          detail: { title: file.name, onConfirm: onDeleteMe },
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
        zIndex: isDragging ? 50 : 10,
      }}
      className={`w-64 p-3 shadow-xl rounded-lg border transition-all duration-200 group/file animate-spawn-card flex items-center gap-3
        ${isTrashMode ? "border-red-500/50 bg-[#3a1a1a] animate-shake cursor-pointer hover:border-red-500" : "bg-[#282828] border-[#383838] cursor-grab active:cursor-grabbing hover:border-gray-500"}
      `}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleCardClick}
    >
      {/* Icon links */}
      <div
        className={`p-2 rounded-md ${isTrashMode ? "bg-red-500/20 text-red-400" : "bg-[#3a3a3a] text-blue-400 group-hover/file:bg-blue-500/20 transition-colors"}`}
      >
        <FileIcon className="w-6 h-6" />
      </div>

      {/* Datei Info */}
      <div className="flex-1 overflow-hidden pointer-events-none">
        <h3 className="text-sm font-medium text-gray-200 truncate">
          {file.name}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{file.size}</p>
      </div>

      {/* Rotes Overlay beim Hover im Trash-Modus */}
      {isTrashMode && (
        <div className="absolute inset-0 bg-red-500/5 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[0.5px]">
          <div className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-lg">
            <Trash2 className="w-3.5 h-3.5" /> Löschen
          </div>
        </div>
      )}

      {/* Der funktionierende Download-Link */}
      {!isTrashMode && (
        <a
          href={file.url}
          download={file.name}
          // Verhindert, dass ein Klick auf den Download das Drag & Drop oder das Löschen auslöst
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#3a3a3a] text-gray-400 hover:text-white cursor-pointer opacity-0 group-hover/file:opacity-100 transition-all"
          title={`${file.name} herunterladen`}
        >
          <Download className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
