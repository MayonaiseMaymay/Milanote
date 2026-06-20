"use client";

import React, { useState, useRef, useEffect } from "react";
import { Pen, Trash, Trash2, Square, CheckSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TrashButton from "./trash_button";

// --- 1. ZOD & REACT-HOOK-FORM IMPORTS ---
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// --- 2. ZOD SCHEMA DEFINIEREN (Aufgabe Schritt 1) ---
const TodoSchema = z.object({
  text: z
    .string()
    .min(1, "Aufgabe darf nicht leer sein")
    .max(100, "Maximal 100 Zeichen erlaubt"),
});

// TypeScript Typ automatisch aus dem Schema ableiten
type TodoInput = z.infer<typeof TodoSchema>;

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}
interface ListInstance {
  id: string;
  x: number;
  y: number;
  title: string;
}

// ==========================================
// DER MANAGER FOR DEINE TO-DO LISTEN
// ==========================================
export default function ToDoListManager() {
  const [lists, setLists] = useState<ListInstance[]>([]);
  const [isTrashMode, setIsTrashMode] = useState(false);

  const listsRef = useRef(lists);
  const isTrashModeRef = useRef(isTrashMode);

  useEffect(() => {
    listsRef.current = lists;
    isTrashModeRef.current = isTrashMode;
  }, [lists, isTrashMode]);

  useEffect(() => {
    const handleAddList = () => {
      if (isTrashModeRef.current) return;
      const currentLists = listsRef.current;
      const count = currentLists.length + 1;
      const offset = (currentLists.length * 25) % 150;

      const newList: ListInstance = {
        id: crypto.randomUUID(),
        x: 120 + offset,
        y: 140 + offset,
        title: `To-do Liste ${count}`,
      };
      setLists((prev) => [...prev, newList]);
    };

    const handleTrashSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ isTrashMode: boolean }>;
      setIsTrashMode(customEvent.detail.isTrashMode);
    };

    window.addEventListener("click-todo-sidebar", handleAddList);
    window.addEventListener("milanote-trash-sync", handleTrashSync);

    const handleSidebarClicks = (e: MouseEvent) => {
      const aside = document.querySelector("aside");
      if (!aside || !aside.contains(e.target as Node)) return;
      const container = (e.target as HTMLElement).closest(".cursor-pointer");
      if (container && container.textContent?.trim().includes("To-do")) {
        e.preventDefault();
        e.stopPropagation();
        handleAddList();
      }
    };

    window.addEventListener("click", handleSidebarClicks, true);

    return () => {
      window.removeEventListener("click", handleSidebarClicks, true);
      window.removeEventListener("milanote-trash-sync", handleTrashSync);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes spawnCard { 0% { opacity: 0; transform: scale(0.93) translateY(15px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes subtleShake { 0% { transform: rotate(0.25deg); } 50% { transform: rotate(-0.25deg); } 100% { transform: rotate(0.25deg); } }
        .animate-spawn-card { animation: spawnCard 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shake { animation: subtleShake 0.2s ease-in-out infinite; }
      `}</style>

      <TrashButton />

      {lists.map((list) => (
        <IndividualToDoList
          key={list.id}
          list={list}
          isTrashMode={isTrashMode}
          onDeleteMe={() =>
            setLists((prev) => prev.filter((l) => l.id !== list.id))
          }
        />
      ))}
    </>
  );
}

// ==========================================
// DIE EINZELNE TO-DO LISTE
// ==========================================
function IndividualToDoList({
  list,
  isTrashMode,
  onDeleteMe,
}: {
  list: ListInstance;
  isTrashMode: boolean;
  onDeleteMe: () => void;
}) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState(list.title);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null);
  const [editValue, setEditValue] = useState("");

  const [position, setPosition] = useState({ x: list.x, y: list.y });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // --- 3. USE-FORM SETUP (Aufgabe Schritt 3) ---
  const form = useForm<TodoInput>({
    resolver: zodResolver(TodoSchema),
    defaultValues: { text: "" },
  });

  // --- WIRD AUSGEFÜHRT, WENN DAS FORMULAR GÜLTIG IST ---
  const onSubmit = (data: TodoInput) => {
    setTodos([
      ...todos,
      { id: crypto.randomUUID(), text: data.text, completed: false },
    ]);
    form.reset(); // Leert das Feld nach erfolgreichem Hinzufügen
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTrashMode) return;
    if (e.button !== 0) return;

    const target = e.target as HTMLElement;
    if (
      target.tagName.toLowerCase() === "input" ||
      target.closest("button") ||
      target.closest(".no-drag")
    )
      return;

    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      setPosition({
        x: dragRef.current.initialX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initialY + (e.clientY - dragRef.current.startY),
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleCardClick = () => {
    if (isTrashMode) {
      window.dispatchEvent(
        new CustomEvent("milanote-request-delete", {
          detail: { title: title || "To-do Liste", onConfirm: onDeleteMe },
        }),
      );
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isDragging ? 50 : 10,
      }}
      className={`w-[300px] shadow-2xl rounded-lg overflow-hidden transition-all duration-200 group/card animate-spawn-card
        bg-[#282828] text-gray-200 text-xs border border-[#383838]
        ${isTrashMode ? "border-red-500/50 bg-red-500/5 animate-shake cursor-pointer hover:border-red-500 hover:bg-red-500/10" : "cursor-grab active:cursor-grabbing"}
      `}
      onMouseDown={handleMouseDown}
      onClick={handleCardClick}
    >
      {isTrashMode && (
        <div className="absolute inset-0 bg-red-500/5 z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[0.5px]">
          <div className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-lg">
            <Trash2 className="w-3.5 h-3.5" /> Liste löschen
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col gap-1.5">
        <div className="px-2 pb-2 mb-2 border-b border-gray-700/50 no-drag">
          <input
            aria-label="Titel der Liste"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent border-none outline-none text-base font-semibold text-gray-200 w-full"
            disabled={isTrashMode}
          />
        </div>

        {todos.map((todo) => (
          <div
            key={todo.id}
            className="flex items-center justify-between group/item px-2 py-1.5 rounded hover:bg-white/5 transition-colors no-drag"
          >
            <div
              className="flex items-center gap-3 flex-1 cursor-pointer"
              onClick={() =>
                !isTrashMode &&
                setTodos(
                  todos.map((t) =>
                    t.id === todo.id ? { ...t, completed: !t.completed } : t,
                  ),
                )
              }
            >
              {todo.completed ? (
                <CheckSquare className="w-4 h-4 text-gray-500 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-gray-400 shrink-0" />
              )}
              <span
                className={`text-[15px] select-none break-all outline-none transition-colors ${todo.completed ? "line-through text-gray-500" : "text-gray-200"}`}
              >
                {todo.text}
              </span>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setTodoToEdit(todo);
                  setEditValue(todo.text);
                  setIsEditDialogOpen(true);
                }}
                disabled={isTrashMode}
              >
                <Pen className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setTodos(todos.filter((t) => t.id !== todo.id));
                }}
                disabled={isTrashMode}
              >
                <Trash className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}

        {/* --- 4. FORMULAR MIT ZOD VALIDIERUNG --- */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-1 px-2 py-1.5 mt-1 no-drag opacity-70 focus-within:opacity-100 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <Square className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              {...form.register("text")} // Registriert das Input bei react-hook-form
              aria-label="Neue Aufgabe"
              placeholder="Add a task..."
              className="bg-transparent border-none outline-none text-[15px] text-gray-200 placeholder:text-gray-500 w-full flex-1"
              disabled={isTrashMode}
              autoComplete="off"
            />
          </div>

          {/* Zeigt Zod Validierungsfehler an */}
          {form.formState.errors.text && (
            <span className="text-red-400 text-[11px] ml-7">
              {form.formState.errors.text.message}
            </span>
          )}
        </form>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-md bg-[#2a2a2a] border-[#383838] text-gray-200"
        >
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              aria-label="Aufgabe bearbeiten"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && editValue.trim().length > 0) {
                  setTodos(
                    todos.map((t) =>
                      t.id === todoToEdit?.id ? { ...t, text: editValue } : t,
                    ),
                  );
                  setIsEditDialogOpen(false);
                }
              }}
              className="bg-[#1a1a1a] border-gray-600 text-white"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 hover:text-white"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                setTodos(
                  todos.map((t) =>
                    t.id === todoToEdit?.id ? { ...t, text: editValue } : t,
                  ),
                );
                setIsEditDialogOpen(false);
              }}
              disabled={!editValue.trim()}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
