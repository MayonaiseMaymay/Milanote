"use client";

import React, { useState } from "react";

// ================= ICONS =================
// Alle UI Icons für Sidebar & Topbar
import {
  Search,
  Bell,
  Settings,
  Undo,
  Redo,
  Smartphone,
  HelpCircle,
  LayoutGrid,
  Type,
  Image as ImageIcon,
  Link,
  CheckSquare,
  PenTool,
  Trash,
  Download,
  Pen,
} from "lucide-react";

// ================= UI COMPONENTS =================
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// ================= MAIN COMPONENT =================
export default function GetNodeBoard() {

  // ================= TOOL STATE =================
  // Speichert welches Tool gerade aktiv ist (z.B. Link setzen)
  const [tool, setTool] = useState<"link" | null>(null);

  // ================= DATA STATE =================
  // Hier speichern wir alle Link-Nodes auf dem Board
  const [links, setLinks] = useState<
    { id: string; x: number; y: number; url: string }[]
  >([]);

  return (
    <div className="flex w-full h-full bg-[#222222] text-gray-200 font-sans overflow-hidden">

      {/* =======================================================
         SIDEBAR → TOOL AUSWAHL (wie in Milanote)
      ======================================================= */}
      <aside className="w-16 bg-[#1a1a1a] border-r border-gray-800 flex flex-col items-center py-4 flex-shrink-0 z-10">
        
        <div className="space-y-6 flex-1 w-full">

          {/* NOTE TOOL (noch nicht aktiv) */}
          <SidebarIcon icon={<Type size={20} />} label="Note" />

          {/* LINK TOOL → aktiviert Link setzen */}
          <SidebarIcon
            icon={<Link size={20} />}
            label="Link"
            active={tool === "link"}
            onClick={() => setTool("link")}
          />

          {/* WEITERE TOOLS (noch ohne Funktion) */}
          <SidebarIcon icon={<CheckSquare size={20} />} label="To-do" />
          <SidebarIcon icon={<PenTool size={20} />} label="Line" />
          <SidebarIcon icon={<LayoutGrid size={20} />} label="Board" />

          {/* TRENNLINIE */}
          <div className="w-8 h-px bg-gray-700 mx-auto my-2"></div>

          {/* MEDIA TOOLS */}
          <SidebarIcon icon={<ImageIcon size={20} />} label="Add image" />
          <SidebarIcon icon={<Download size={20} className="rotate-180" />} label="Upload" />
          <SidebarIcon icon={<Pen size={20} />} label="Draw" />
        </div>

        {/* TRASH */}
        <div className="w-full">
          <SidebarIcon icon={<Trash size={20} />} label="Trash" />
        </div>
      </aside>

      {/* =======================================================
         MAIN LAYOUT → TOPBAR + CANVAS
      ======================================================= */}
      <div className="flex flex-col flex-1">

        {/* ================= TOPBAR ================= */}
        <header className="h-14 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          
          {/* LEFT → Navigation */}
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xs">M</span>
            </div>
            <span className="font-semibold text-white">Home</span>
            <span>/</span>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
              <span>Game project</span>
            </div>
          </div>

          {/* CENTER → Titel */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl font-serif font-bold text-white">
              Game project
            </h1>
          </div>

          {/* RIGHT → Actions */}
          <div className="flex items-center space-x-4 text-gray-400">
            <div className="flex space-x-3">
              <Undo size={18} />
              <Redo size={18} />
              <Smartphone size={18} />
              <HelpCircle size={18} />
              <Search size={18} />
              <Bell size={18} />
              <Settings size={18} />
            </div>
          </div>
        </header>

        {/* ================= CANVAS ================= */}
        <main className="flex-1 relative overflow-hidden bg-[#2a2a2a]">

          {/* INFO BOX → zeigt Anzahl Links */}
          <div className="absolute top-4 right-4 bg-[#333] px-3 py-1.5 rounded-md text-xs border border-gray-700 z-10">
            {links.length} Links
          </div>

          {/* =======================================================
             INTERACTIVE CANVAS
             → hier entstehen neue Nodes
          ======================================================= */}
          <div
            className="w-full h-full relative"
            onClick={(e) => {

              // Nur wenn Link Tool aktiv ist
              if (tool === "link") {

                // Position relativ zum Canvas berechnen
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();

                // Neues Link-Element hinzufügen
                setLinks((prev) => [
                  ...prev,
                  {
                    id: crypto.randomUUID(), // eindeutige ID
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    url: "",
                  },
                ]);
              }
            }}
          >

            {/* =======================================================
               RENDER → Alle Link Nodes anzeigen
            ======================================================= */}
            {links.map((link) => (
              <div
                key={link.id}
                className="absolute"
                style={{ left: link.x, top: link.y }}
              >
                <Card className="w-56 p-3 space-y-2 shadow-md">

                  {/* INPUT → URL eingeben */}
                  <Input
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => {
                      setLinks((prev) =>
                        prev.map((l) =>
                          l.id === link.id
                            ? { ...l, url: e.target.value }
                            : l
                        )
                      );
                    }}
                  />

                  {/* LINK → Öffnen */}
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      className="text-blue-400 text-xs underline break-all"
                    >
                      Open Link
                    </a>
                  )}

                </Card>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}

// =======================================================
// SIDEBAR ICON COMPONENT
// → Wiederverwendbare UI für Tools
// =======================================================
const SidebarIcon = ({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`flex flex-col items-center justify-center cursor-pointer group w-full py-1 ${
      active ? "text-blue-400" : "text-gray-400 hover:text-white"
    }`}
  >
    <div
      className={`p-2 rounded-lg ${
        active ? "bg-[#2a2a2a]" : "group-hover:bg-[#2a2a2a]"
      }`}
    >
      {icon}
    </div>
    <span className="text-[10px] mt-1 opacity-80">{label}</span>
  </div>
);