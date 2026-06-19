'use client'; 

import React, { useState, useRef } from 'react';

export function get_node_Text() {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{ startX: number; startY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'textarea') return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragRef.current) return;
    
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={`absolute p-4 bg-white border border-gray-300 rounded shadow-md min-w-[200px] min-h-[100px] flex flex-col ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      style={{
        left: position.x,
        top: position.y,
        resize: 'both', 
        overflow: 'hidden'
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* drag-handle: der obere balken, an dem man den node greift */}
      <div className="w-full h-4 bg-gray-100 hover:bg-gray-200 mb-2 rounded shrink-0 transition-colors" />

      {/* das eigentliche textfeld */}
      <textarea
        className="w-full h-full resize-none outline-none bg-transparent flex-1"
        placeholder="Schreib etwas..."
      />
    </div>
  );
}