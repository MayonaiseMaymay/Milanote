"use client";

import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";

interface GetNodeTextProps {
  initialX: number;
  initialY: number;
  onDelete: () => void;
}

export default function get_node_Text({
  initialX,
  initialY,
  onDelete,
}: GetNodeTextProps) {
  // Die Position wird jetzt über Props initialisiert (wichtig fürs Droppen!)
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: 250, height: 120 });

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [text, setText] = useState("");

  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // delete logic
  const [isTrashMode, setIsTrashMode] = useState(false);
  useEffect(() => {
    const handleSync = (e: Event) => {
      setIsTrashMode((e as CustomEvent).detail.isTrashMode);
    };
    window.addEventListener("milanote-trash-sync", handleSync);
    return () => window.removeEventListener("milanote-trash-sync", handleSync);
  }, []);

  const handleNoteClick = () => {
    if (isTrashMode) {
      window.dispatchEvent(
        new CustomEvent("milanote-request-delete", {
          detail: {
            title: "Notizzettel",
            onConfirm: onDelete,
          },
        }),
      );
    }
  };

  // --- DRAG LOGIK ---
  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return;

    // Setzt den Fokus auf das umschließende Div, damit Key-Events registriert werden
    containerRef.current?.focus();

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

  // --- RESIZE LOGIK ---
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
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
    setSize({
      width: Math.max(
        150,
        resizeRef.current.startW + (e.clientX - resizeRef.current.startX),
      ),
      height: Math.max(
        60,
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

  // --- TASTATUR LOGIK ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Nur löschen, wenn wir NICHT aktiv im Textfeld tippen
    if ((e.key === "Backspace" || e.key === "Delete") && !isEditing) {
      onDelete();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0} // Macht das Div fokussierbar für KeyDown-Events
      className={`absolute p-4 bg-[#333333] border rounded shadow-lg flex flex-col transition-colors outline-none focus:border-blue-500 ${
        !isEditing
          ? isDragging
            ? "cursor-grabbing border-gray-500"
            : "cursor-grab border-[#444444] hover:border-gray-500"
          : "cursor-default border-blue-500"
      }`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      onPointerDown={handleDragPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onDoubleClick={() => setIsEditing(true)}
      onKeyDown={handleKeyDown}
    >
      <textarea
        ref={textareaRef}
        className={`w-full h-full resize-none outline-none bg-transparent flex-1 text-gray-200 placeholder-gray-500 ${
          !isEditing ? "pointer-events-none" : ""
        }`}
        placeholder="Schreib etwas..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setIsEditing(false)}
        readOnly={!isEditing}
      />

      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-40 hover:opacity-100"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      >
        <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-gray-400 rounded-sm" />
      </div>
    </div>
  );
}
