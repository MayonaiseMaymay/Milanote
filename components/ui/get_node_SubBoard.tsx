"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SubBoardProps {
  id: string;
  initialTitle: string;
  cardCount: number;
  onDelete: () => void;
  onUpdateTitle: (newTitle: string) => void;
}

export default function Get_node_SubBoard({
  id,
  initialTitle,
  cardCount,
  onDelete,
  onUpdateTitle,
}: SubBoardProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle || "New Board");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fokus auf das Input-Feld setzen, wenn der Bearbeitungsmodus startet
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    if (title.trim() !== initialTitle) {
      onUpdateTitle(title.trim() || "New Board");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  // Navigiert bei Doppelklick zum dynamischen Board-Pfad
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/board/${id}`);
  };

  return (
    <div className="flex flex-col items-center gap-2 group relative w-24">
      {/* Das Board-Icon */}
      <div
        onDoubleClick={handleDoubleClick}
        className="w-[72px] h-[72px] bg-[#c4c4c4] hover:bg-[#d4d4d4] rounded-2xl shadow-sm transition-colors cursor-pointer flex-shrink-0"
      />

      {/* Titel-Bereich */}
      <div className="w-full flex flex-col items-center text-center">
        {isEditing ? (
          <input
            aria-label="Board Titel"
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full bg-[#333] text-white text-sm font-bold text-center border border-blue-500 rounded px-1 outline-none"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-white text-sm font-bold truncate w-full cursor-text px-1 border border-transparent hover:border-gray-600 rounded"
          >
            {title}
          </span>
        )}

        {/* Karten-Zähler */}
        <span className="text-gray-500 text-xs mt-0.5">
          {cardCount} {cardCount === 1 ? "card" : "cards"}
        </span>
      </div>
    </div>
  );
}
