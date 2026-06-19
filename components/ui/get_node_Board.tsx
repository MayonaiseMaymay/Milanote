"use client";

import React, { useState } from "react";
import Get_node_Text from "./get_node_Text";

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

// ================= TYPES =================
type Tool = "note" | "link" | null;

interface NodeItem {
  id: string;
  x: number;
  y: number;
}

interface LinkItem {
  id: string;
  x: number;
  y: number;
  url: string;
}

// ================= MAIN COMPONENT =================
export default function GetNodeBoard() {
  const [tool, setTool] = useState<Tool>(null);

  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  // ================= DROP HANDLER =================
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodeType = e.dataTransfer.getData("node-type");

    // NOTE via drag & drop
    if (nodeType === "Note" || tool === "note") {
      setNodes((prev) => [
        ...prev,
        { id: crypto.randomUUID(), x, y },
      ]);
    }

    // LINK via drop (optional fallback)
    if (tool === "link") {
      setLinks((prev) => [
        ...prev,
        { id: crypto.randomUUID(), x, y, url: "" },
      ]);
    }
  };

  return (
    <div className="flex w-full h-full bg-[#222222] text-gray-200 font-sans overflow-hidden">

      {/* ================= SIDEBAR ================= */}
      <aside className="w-16 bg-[#1a1a1a] border-r border-gray-800 flex flex-col items-center py-4 flex-shrink-0 z-10">
        <div className="space-y-6 flex-1 w-full">

          <SidebarIcon
            icon={<Type size={20} />}
            label="Note"
            active={tool === "note"}
            onClick={() => setTool("note")}
            draggable
            onDragStart={(e) =>
              e.dataTransfer.setData("node-type", "Note")
            }
          />

          <SidebarIcon
            icon={<Link size={20} />}
            label="Link"
            active={tool === "link"}
            onClick={() => setTool("link")}
          />

          <SidebarIcon icon={<CheckSquare size={20} />} label="To-do" />
          <SidebarIcon icon={<PenTool size={20} />} label="Line" />
          <SidebarIcon icon={<LayoutGrid size={20} />} label="Board" />

          <div className="w-8 h-px bg-gray-700 mx-auto my-2"></div>

          <SidebarIcon icon={<ImageIcon size={20} />} label="Add image" />
          <SidebarIcon icon={<Download size={20} className="rotate-180" />} label="Upload" />
          <SidebarIcon icon={<Pen size={20} />} label="Draw" />
        </div>

        <div className="w-full">
          <SidebarIcon icon={<Trash size={20} />} label="Trash" />
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex flex-col flex-1">

        {/* TOPBAR */}
        <header className="h-14 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4">
          <div className="text-sm text-gray-400 flex gap-2">
            <span className="font-bold text-white">Home</span>
            <span>/</span>
            <span>Game project</span>
          </div>

          <h1 className="absolute left-1/2 -translate-x-1/2 text-white font-bold">
            Game project
          </h1>

          <div className="flex gap-3 text-gray-400">
            <Undo size={18} />
            <Redo size={18} />
            <Smartphone size={18} />
            <HelpCircle size={18} />
            <Search size={18} />
            <Bell size={18} />
            <Settings size={18} />
          </div>
        </header>

        {/* ================= CANVAS ================= */}
        <main
          className="flex-1 relative overflow-hidden bg-[#2a2a2a]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={(e) => {
            if (tool !== "link") return;

            const rect = e.currentTarget.getBoundingClientRect();

            setLinks((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                url: "",
              },
            ]);
          }}
        >

          {/* COUNTER */}
          <div className="absolute top-4 right-4 bg-[#333] px-3 py-1 text-xs rounded-md border border-gray-700 z-10">
            {nodes.length + links.length} Items
          </div>

          {/* CANVAS CONTENT */}
          <div className="w-full h-full relative">

            {/* NOTES */}
            {nodes.map((node) => (
              <Get_node_Text
                key={node.id}
                initialX={node.x}
                initialY={node.y}
                onDelete={() =>
                  setNodes((prev) =>
                    prev.filter((n) => n.id !== node.id)
                  )
                }
              />
            ))}

            {/* LINKS */}
            {links.map((link) => (
              <div
                key={link.id}
                className="absolute"
                style={{ left: link.x, top: link.y }}
              >
                <div className="bg-[#1f1f1f] border border-gray-700 p-3 rounded-md w-56">

                  <input
                    className="w-full bg-transparent border border-gray-700 p-1 text-sm"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => {
                      const value = e.target.value;

                      setLinks((prev) =>
                        prev.map((l) =>
                          l.id === link.id
                            ? { ...l, url: value }
                            : l
                        )
                      );
                    }}
                  />

                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      className="text-blue-400 text-xs underline block mt-2"
                    >
                      Open Link
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

// ================= SIDEBAR ICON =================
const SidebarIcon = ({
  icon,
  label,
  active = false,
  onClick,
  draggable,
  onDragStart,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
}) => (
  <div
    onClick={onClick}
    draggable={draggable}
    onDragStart={onDragStart}
    className={`flex flex-col items-center justify-center cursor-pointer w-full py-1 ${
      active ? "text-blue-400" : "text-gray-400 hover:text-white"
    }`}
  >
    <div className="p-2 rounded-lg hover:bg-[#2a2a2a]">
      {icon}
    </div>
    <span className="text-[10px] mt-1 opacity-80">{label}</span>
  </div>
);