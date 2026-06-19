'use client';

import React, { useState, useRef, useEffect } from 'react';

export function get_node_Text() {
  // States für Position und Größe
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [size, setSize] = useState({ width: 250, height: 120 });
  
  // Modus-States
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [text, setText] = useState("");

  // Refs zum Speichern der Start-Koordinaten während des Ziehens/Vergrößerns
  const dragRef = useRef<{ startX: number; startY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatischer Fokus beim Doppelklick
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // --- 1. DRAG LOGIK (Bewegen) ---
  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return;
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

  // --- 2. RESIZE LOGIK (Größe anpassen) ---
  const handleResizePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation(); // WICHTIG: Verhindert, dass das normale Dragging ausgelöst wird!
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
    
    // Berechnet die neue Breite/Höhe und verhindert, dass es zu klein wird
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

  return (
    <div
      className={`absolute p-4 bg-[#333333] border border-[#444444] rounded shadow-lg flex flex-col transition-colors ${
        !isEditing ? (isDragging ? 'cursor-grabbing' : 'cursor-grab hover:border-gray-500') : 'cursor-default border-blue-500'
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
    >
      <textarea
        ref={textareaRef}
        className={`w-full h-full resize-none outline-none bg-transparent flex-1 text-gray-200 placeholder-gray-500 ${
          !isEditing ? 'pointer-events-none' : ''
        }`}
        placeholder="Schreib etwas..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => setIsEditing(false)}
        readOnly={!isEditing}
      />

      {/* CUSTOM RESIZE HANDLE */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-40 hover:opacity-100"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerUp}
      >
        {/* Kleines visuelles Dreieck für die Ecke */}
        <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-gray-400 rounded-sm" />
      </div>
    </div>
  );
}