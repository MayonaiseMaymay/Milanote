"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Get_node_Text from "./get_node_Text";
import Get_node_SubBoard from "./get_node_SubBoard";
import Get_node_ImageManager from "@/components/ui/get_node_image";
import ToDoListManager, {
  IndividualToDoList,
} from "@/components/ui/get_node_ToDoList";
import ImageNodeManager from "@/components/ui/get_node_image";
import FileNodeManager from "@/components/ui/file_node";

import { createText } from "@/app/actions/createText";
import { deleteText } from "@/app/actions/deleteText";
import { updatePosition } from "@/app/actions/updatePosition";
import { createSubBoard } from "@/app/actions/createSubBoard";
import { updateSubBoardTitle } from "@/app/actions/updateSubBoardTitle";

import toast from "react-hot-toast";
import { createTodoList } from "@/app/actions/createTodoList";
import { updateTodoListPosition } from "@/app/actions/updateTodoListPosition";
import { deleteTodoList } from "@/app/actions/deleteTodoList";
import TrashButton from "./trash_button";

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
type Tool = "note" | "link" | "board" | "todo" | null;

interface NodeItem {
  id: string;
  x: number;
  y: number;
  content: string;
}

interface SubBoardItem {
  id: string;
  x: number;
  y: number;
  title: string;
  cardCount: number;
}
interface LinkItem {
  id: string;
  x: number;
  y: number;
  url: string;
}
interface ListInstance {
  id: string;
  x: number;
  y: number;
  title: string;
}

interface GetNodeBoardProps {
  boardId?: string;
  breadcrumbs?: { id: string; title: string }[];
  initialNodes?: NodeItem[];
  initialSubBoards?: SubBoardItem[];
  initialTodos?: TodoItem[];
  initialTodoLists?: ListInstance[];
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  todoListId: string;
}

// ================= MAIN =================
export default function GetNodeBoard({
  boardId = "default-board",
  breadcrumbs = [{ id: "default", title: "Game project" }],
  initialNodes = [],
  initialSubBoards = [],
  initialTodos = [],
  initialTodoLists = [],
}: GetNodeBoardProps) {
  const router = useRouter();

  const [tool, setTool] = useState<Tool>(null);
  const [nodes, setNodes] = useState<NodeItem[]>(initialNodes);
  const [subBoards, setSubBoards] = useState<SubBoardItem[]>(initialSubBoards);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [todoLists, setTodoLists] = useState<ListInstance[]>(initialTodoLists);

  const [dragging, setDragging] = useState<{
    type: "node" | "link" | "board" | "todo";
    id: string;
    initialX: number; // Startposition des Elements
    initialY: number;
    startX: number; // Startposition der Maus
    startY: number;
  } | null>(null);

  // --- NEU: ZOOM LOGIK ---
  const [scale, setScale] = useState(1);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mainElement = mainRef.current;
    if (!mainElement) return;

    const handleWheel = (e: WheelEvent) => {
      // Wenn Strg (Windows) oder Cmd (Mac) gedrückt ist
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Blockiert den normalen Browser-Zoom!

        setScale((prev) => {
          // Zoom-Berechnung
          const zoomFactor = e.deltaY * -0.002;
          const newScale = prev + zoomFactor;
          // Begrenzt den Zoom zwischen 20% (Rauszoomen) und 200% (Reinzoomen)
          return Math.min(Math.max(0.2, newScale), 2);
        });
      }
    };

    // WICHTIG: { passive: false } erlaubt uns, den Browser-Standard zu blockieren
    mainElement.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      mainElement.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // ================= DRAG & DROP LOGIK =================
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();

    // Zoom-Faktor bei der Berechnung einbeziehen!
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const nodeType = e.dataTransfer.getData("node-type");

    if (nodeType === "Note") {
      const tempId = crypto.randomUUID();
      setNodes((prev) => [...prev, { id: tempId, x, y, content: "" }]);
      const result = await createText({
        x,
        y,
        boardId: boardId,
        content: "",
      });
      if (result && result.success && result.data) {
        setNodes((prev) =>
          prev.map((n) => (n.id === tempId ? { ...n, id: result.data.id } : n)),
        );
      } else {
        setNodes((prev) => prev.filter((n) => n.id !== tempId));
        toast.error("Fehler beim Erstellen der Notiz.");
      }
    } else if (nodeType === "Board") {
      const tempId = crypto.randomUUID();
      setSubBoards((prev) => [
        ...prev,
        { id: tempId, x, y, title: "New Board", cardCount: 0 },
      ]);

      const result = await createSubBoard(boardId, x, y);
      if (result && result.success && result.data) {
        setSubBoards((prev) =>
          prev.map((b) => (b.id === tempId ? { ...b, id: result.data.id } : b)),
        );
      } else {
        setSubBoards((prev) => prev.filter((b) => b.id !== tempId));
        toast.error("Fehler beim Erstellen des Boards.");
      }
    } else if (nodeType === "Link") {
      setLinks((prev) => [...prev, { id: crypto.randomUUID(), x, y, url: "" }]);
    } else if (nodeType === "Todo") {
      const listId = crypto.randomUUID();
      setTodoLists((prev) => [
        ...prev,
        { id: listId, x, y, title: "Neue To-Do Liste" },
      ]);

      await createTodoList(listId, x, y, boardId);
    }
  };

  const startDrag = (
    e: React.PointerEvent,
    type: "node" | "link" | "board" | "todo",
    id: string,
    x: number,
    y: number,
  ) => {
    e.stopPropagation();
    setDragging({
      type,
      id,
      initialX: x,
      initialY: y,
      startX: e.clientX,
      startY: e.clientY,
    });
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;

    // Zoom-Faktor bei der Berechnung der Mausbewegung einbeziehen!
    const dx = (e.clientX - dragging.startX) / scale;
    const dy = (e.clientY - dragging.startY) / scale;

    const newX = dragging.initialX + dx;
    const newY = dragging.initialY + dy;

    if (dragging.type === "node") {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragging.id ? { ...n, x: newX, y: newY } : n,
        ),
      );
    } else if (dragging.type === "board") {
      setSubBoards((prev) =>
        prev.map((b) =>
          b.id === dragging.id ? { ...b, x: newX, y: newY } : b,
        ),
      );
    } else if (dragging.type === "link") {
      setLinks((prev) =>
        prev.map((l) =>
          l.id === dragging.id ? { ...l, x: newX, y: newY } : l,
        ),
      );
    } else if (dragging.type === "todo") {
      setTodoLists((prev) =>
        prev.map((l) =>
          l.id === dragging.id ? { ...l, x: newX, y: newY } : l,
        ),
      );
    }
  };

  const stopDrag = async () => {
    if (!dragging) return;

    if (dragging.type === "node") {
      const draggedNode = nodes.find((n) => n.id === dragging.id);
      if (draggedNode) {
        await updatePosition(draggedNode.id, draggedNode.x, draggedNode.y);
      }
    } else if (dragging.type === "board") {
      const draggedBoard = subBoards.find((b) => b.id === dragging.id);
      // Hierfür wird später die updateBoardPosition Server Action benötigt
    } else if (dragging.type === "todo") {
      const draggedList = todoLists.find((l) => l.id === dragging.id);
      if (draggedList) {
        await updateTodoListPosition(
          draggedList.id,
          draggedList.x,
          draggedList.y,
        );
      }
    }
    setDragging(null);
  };

  return (
    <div className="flex w-full h-full bg-[#222222] text-gray-200 font-sans overflow-hidden">
      <TrashButton />

      {/* ================= SIDEBAR ================= */}
      {/* Hinweis: shrink-0 hinzugefügt, damit das Raster die Sidebar nicht verdrängt */}
      <aside className="w-16 shrink-0 bg-[#1a1a1a] border-r border-gray-800 flex flex-col items-center py-4 z-10">
        <div className="space-y-6 flex-1 w-full">
          <SidebarIcon
            icon={<Type size={20} />}
            label="Note"
            draggable
            onDragStart={(e: any) =>
              e.dataTransfer.setData("node-type", "Note")
            }
          />
          <SidebarIcon
            icon={<Link size={20} />}
            label="Link"
            draggable
            onDragStart={(e: any) =>
              e.dataTransfer.setData("node-type", "Link")
            }
          />
          <SidebarIcon
            icon={<CheckSquare size={20} />}
            label="To-do"
            draggable
            onDragStart={(e: any) =>
              e.dataTransfer.setData("node-type", "Todo")
            }
          />
          <SidebarIcon icon={<PenTool size={20} />} label="Line" />

          <SidebarIcon
            icon={<LayoutGrid size={20} />}
            label="Board"
            active={tool === "board"}
            onClick={() => setTool("board")}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("node-type", "Board")}
          />

          <div className="w-8 h-px bg-gray-700 mx-auto my-2" />

          <SidebarIcon icon={<ImageIcon size={20} />} label="Add image" />
          <SidebarIcon icon={<Download size={20} />} label="Upload" />
          <SidebarIcon icon={<Pen size={20} />} label="Draw" />
        </div>
        <SidebarIcon icon={<Trash size={20} />} label="Trash" />
      </aside>

      {/* ================= MAIN ================= */}
      {/* Hinweis: overflow-hidden auf den Flex-Container angewandt, damit der Main-Container sauber bleibt */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* TOPBAR MIT DYNAMISCHEN BREADCRUMBS */}
        <header className="h-14 shrink-0 bg-[#1a1a1a] flex items-center px-6 border-b border-gray-800 z-50">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              {idx > 0 && (
                <span className="mx-3 text-gray-500 font-light text-xl">/</span>
              )}

              <span
                className={`transition-colors text-lg tracking-wide ${
                  idx === breadcrumbs.length - 1
                    ? "text-white font-bold"
                    : "text-gray-400 hover:text-white cursor-pointer font-semibold"
                }`}
                onClick={() => {
                  if (idx !== breadcrumbs.length - 1) {
                    router.push(`/board/${crumb.id}`);
                  }
                }}
              >
                {crumb.title}
              </span>
            </React.Fragment>
          ))}
        </header>

        {/* ================= CANVAS ================= */}
        <main
          ref={mainRef}
          className="flex-1 overflow-auto bg-[#2a2a2a] relative"
        >
          <div
            className="relative origin-top-left"
            style={{
              width: "5000px",
              height: "5000px",
              transform: `scale(${scale})`,
              backgroundImage: "radial-gradient(#444 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onPointerMove={onMove}
            onPointerUp={stopDrag}
            onPointerLeave={stopDrag}
          >
            {/* SUB-BOARDS RENDERN */}
            {subBoards.map((board) => (
              <div
                key={board.id}
                className="absolute"
                style={{ left: board.x, top: board.y }}
                onPointerDown={(e) =>
                  startDrag(e, "board", board.id, board.x, board.y)
                }
              >
                <Get_node_SubBoard
                  id={board.id}
                  initialTitle={board.title}
                  cardCount={board.cardCount}
                  onDelete={() =>
                    setSubBoards((prev) =>
                      prev.filter((b) => b.id !== board.id),
                    )
                  }
                  onUpdateTitle={async (newTitle: string) => {
                    setSubBoards((prev) =>
                      prev.map((b) =>
                        b.id === board.id ? { ...b, title: newTitle } : b,
                      ),
                    );
                    await updateSubBoardTitle(board.id, newTitle, boardId);
                  }}
                />
              </div>
            ))}

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
                  id={node.id}
                  initialContent={node.content}
                  onDelete={async () => {
                    setNodes((prev) => prev.filter((n) => n.id !== node.id));
                    await deleteText(node.id);
                  }}
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
                    aria-label="Link URL"
                    value={link.url}
                    onChange={(e) => {
                      const value = e.target.value;
                      setLinks((prev) =>
                        prev.map((l) =>
                          l.id === link.id ? { ...l, url: value } : l,
                        ),
                      );
                    }}
                  />
                </div>
              </div>
            ))}

            {/* TODO LISTEN */}
            {todoLists.map((list) => (
              <div
                key={list.id}
                className="absolute"
                style={{ left: list.x, top: list.y }}
                onPointerDown={(e) =>
                  startDrag(e, "todo", list.id, list.x, list.y)
                }
              >
                <IndividualToDoList
                  list={list}
                  isTrashMode={false}
                  onDeleteMe={async () => {
                    const originalLists = [...todoLists];
                    setTodoLists((prev) =>
                      prev.filter((l) => l.id !== list.id),
                    );

                    const result = await deleteTodoList(list.id);
                    if (!result) {
                      setTodoLists(originalLists);
                      alert(
                        "Fehler: Die Liste konnte nicht aus der Datenbank gelöscht werden!",
                      );
                    }
                  }}
                  initialTodos={(initialTodos || []).filter(
                    (t) => t.todoListId === list.id,
                  )}
                />
              </div>
            ))}

            <ImageNodeManager />
            <FileNodeManager />
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
