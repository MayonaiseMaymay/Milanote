"use client";

import React, { useState } from "react";
import Get_node_Text from "./get_node_Text";
import ToDoListManager from "@/components/ui/get_node_ToDoList";

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

// ================= MAIN =================
export default function GetNodeBoard() {
  const [tool, setTool] = useState<Tool>(null);

  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);

  const [dragging, setDragging] = useState<{
    type: "node" | "link";
    id: string;
  } | null>(null);

  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // ================= CREATE NODE =================
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nodeType = e.dataTransfer.getData("node-type");

    if (nodeType === "Note" || tool === "note") {
      setNodes((prev) => [
        ...prev,
        { id: crypto.randomUUID(), x, y },
      ]);
    }
  };

  // ================= DRAG =================
  const startDrag = (
    e: React.PointerEvent,
    type: "node" | "link",
    id: string,
    x: number,
    y: number
  ) => {
    setDragging({ type, id });

    setOffset({
      x: e.clientX - x,
      y: e.clientY - y,
    });
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    const rect = e.currentTarget.getBoundingClientRect();

    const x = e.clientX - rect.left - offset.x;
    const y = e.clientY - rect.top - offset.y;

    if (dragging.type === "node") {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragging.id ? { ...n, x, y } : n
        )
      );
    }

    if (dragging.type === "link") {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === dragging.id ? { ...l, x, y } : l
        )
      );
    }
  };

  const stopDrag = () => setDragging(null);

  // ================= UI =================
  return (
    <div className="flex w-full h-full bg-[#222222] text-gray-200 font-sans overflow-hidden">

      {/* ================= SIDEBAR (UNCHANGED) ================= */}
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

          <div className="w-8 h-px bg-gray-700 mx-auto my-2" />

          <SidebarIcon icon={<ImageIcon size={20} />} label="Add image" />
          <SidebarIcon icon={<Download size={20} />} label="Upload" />
          <SidebarIcon icon={<Pen size={20} />} label="Draw" />
        </div>

        <SidebarIcon icon={<Trash size={20} />} label="Trash" />
      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex flex-col flex-1">

        {/* TOPBAR (UNCHANGED) */}
        <header className="h-14 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span className="text-white font-semibold">Game project</span>
          </div>

          <div className="flex items-center space-x-4 text-gray-400">
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
          className="flex-1 relative bg-[#2a2a2a]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onPointerMove={onMove}
          onPointerUp={stopDrag}
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

          <div className="relative w-full h-full">

            {/* NOTES */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute"
                style={{ left: node.x, top: node.y }}
                onPointerDown={(e) =>
                  startDrag(e, "node", node.id, node.x, node.y)
                }
              >
                <Get_node_Text
                  initialX={0}
                  initialY={0}
                  onDelete={() =>
                    setNodes((prev) =>
                      prev.filter((n) => n.id !== node.id)
                    )
                  }
                />
              </div>
            ))}

            {/* LINKS */}
            {links.map((link) => (
              <div
                key={link.id}
                className="absolute"
                style={{ left: link.x, top: link.y }}
                onPointerDown={(e) =>
                  startDrag(e, "link", link.id, link.x, link.y)
                }
              >
                <div className="bg-[#1f1f1f] border border-gray-700 p-3 rounded-md w-56">
                  <input
                    className="w-full bg-transparent border border-gray-700 p-1 text-sm text-gray-200"
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
                </div>
              </div>
            ))}

            {/* ================= TODO OVERLAY (NO LAYOUT CHANGE) ================= */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="pointer-events-auto">
                <ToDoListManager />
              </div>
            </div>

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
    className={`flex flex-col items-center cursor-pointer w-full py-1 ${
      active ? "text-blue-400" : "text-gray-400 hover:text-white"
    }`}
  >
    <div className="p-2">{icon}</div>
    <span className="text-[10px]">{label}</span>
  </div>
);