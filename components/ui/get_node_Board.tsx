"use client";

import React from "react";
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

export default function GetNodeBoard() {
  return (
    <div className="flex w-full h-full bg-[#222222] text-gray-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-16 bg-[#1a1a1a] border-r border-gray-800 flex flex-col items-center py-4 flex-shrink-0 z-10">
        <div className="space-y-6 flex-1 w-full">
          <SidebarIcon icon={<Type size={20} />} label="Note" />
          <SidebarIcon icon={<Link size={20} />} label="Link" />
          <SidebarIcon icon={<CheckSquare size={20} />} label="To-do" />
          <SidebarIcon icon={<PenTool size={20} />} label="Line" active />
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

      {/* MAIN */}
      <div className="flex flex-col flex-1">

        {/* TOPBAR */}
        <header className="h-14 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
          
          {/* LEFT */}
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

          {/* CENTER TITLE */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <h1 className="text-xl font-serif font-bold text-white">
              Game project
            </h1>
          </div>

          {/* RIGHT */}
          <div className="flex items-center space-x-4 text-gray-400">
            <div className="flex space-x-3">
              <Undo size={18} className="cursor-pointer hover:text-white" />
              <Redo size={18} className="cursor-pointer hover:text-white" />
              <Smartphone size={18} className="cursor-pointer hover:text-white" />
              <HelpCircle size={18} className="cursor-pointer hover:text-white" />
              <Search size={18} className="cursor-pointer hover:text-white" />
              <Bell size={18} className="cursor-pointer hover:text-white" />
              <Settings size={18} className="cursor-pointer hover:text-white" />
            </div>

            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-purple-500 border border-[#1a1a1a]" />
              <div className="w-6 h-6 rounded-full bg-blue-500 border border-[#1a1a1a]" />
              <div className="w-6 h-6 rounded-full bg-green-500 border border-[#1a1a1a]" />
            </div>

            <div className="flex space-x-3 text-sm">
              <button className="hover:text-white">Share</button>
              <button className="hover:text-white">Export ▾</button>
              <button className="hover:text-white">80% ▾</button>
            </div>
          </div>
        </header>

        {/* 🔥 CANVAS (FIXED) */}
        <main className="flex-1 relative overflow-hidden bg-[#2a2a2a]">

          {/* Badge */}
          <div className="absolute top-4 right-4 bg-[#333] px-3 py-1.5 rounded-md text-xs font-semibold border border-gray-700 z-10">
            0 Unsorted
          </div>

          {/* Canvas Fläche */}
          <div className="w-full h-full">
            {/* später: Nodes / Canvas */}
          </div>

        </main>

      </div>
    </div>
  );
}

const SidebarIcon = ({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) => (
  <div
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