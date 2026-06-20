"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { updateText } from "@/app/actions/updateText"; // <-- NEU

interface GetNodeTextProps {
  id: string; // <-- WICHTIG: Wir brauchen die ID aus der DB!
  initialContent: string;
  onDelete: () => void;
}

export default function Get_node_Text({ id, initialContent, onDelete }: GetNodeTextProps) {
  // Dragging und eigene Positionierung sind komplett weg!
  const [size, setSize] = useState({ width: 250, height: 120 });
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const form = useForm({
    defaultValues: { 
      content: initialContent || "",
    },
  });

  // Fokus-Logik für react-hook-form
  useEffect(() => {
    if (isEditing) {
      form.setFocus("content");
    }
  }, [isEditing, form]);

  // Server Action aufrufen (UPDATE statt CREATE)
  async function onSubmit(data: { content: string }) {
    try {
      await updateText(id, data.content);
      setIsEditing(false); 
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
    }
  }

  // --- RESIZE LOGIK ---
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Wichtig, damit das Board nicht denkt, wir wollen draggen!
    setIsResizing(true);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: size.width, startH: size.height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing || !resizeRef.current) return;
    setSize({
      width: Math.max(150, resizeRef.current.startW + (e.clientX - resizeRef.current.startX)),
      height: Math.max(60, resizeRef.current.startH + (e.clientY - resizeRef.current.startY)),
    });
  };

  const handleResizePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    setIsResizing(false);
    resizeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Backspace' || e.key === 'Delete') && !isEditing) {
      onDelete();
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      // "absolute", "left" und "top" sind weg. Das div ist jetzt 100% so groß wie das Elternelement vorgibt!
      className={`relative p-4 bg-[#333333] border rounded shadow-lg flex flex-col transition-colors outline-none focus:border-blue-500 w-full h-full ${
        !isEditing 
          ? 'cursor-grab border-[#444444] hover:border-gray-500' 
          : 'cursor-default border-blue-500'
      }`}
      style={{ width: size.width, height: size.height }}
      onDoubleClick={() => setIsEditing(true)}
      onKeyDown={handleKeyDown}
    >
      <form 
        className="flex-1 flex flex-col w-full h-full relative"
        onBlur={form.handleSubmit(onSubmit)} 
      >
        <textarea
          {...form.register("content")}
          className={`w-full h-full resize-none outline-none bg-transparent text-gray-200 placeholder-gray-500 ${
            !isEditing ? 'pointer-events-none' : ''
          }`}
          placeholder="Schreib etwas..."
          readOnly={!isEditing}
        />
      </form>

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