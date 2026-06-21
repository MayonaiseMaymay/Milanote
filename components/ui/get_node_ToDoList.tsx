"use client";

import React, { useState, useEffect } from "react";
import { Pen, Trash, Square, CheckSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TrashButton from "./trash_button";

// Server-Actions
import { createTodo } from "@/app/actions/createTodo";
import { toggleTodo } from "@/app/actions/toggleTodo";
import { deleteTodoList } from "@/app/actions/deleteTodoList"; // <-- Korrigiert: deleteTodo für einzelne Aufgaben

// --- INTERFACES ---
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  todoListId: string;
}

interface ListInstance {
  id: string;
  x: number;
  y: number;
  title: string;
}

const TodoSchema = z.object({
  text: z
    .string()
    .min(1, "Aufgabe darf nicht leer sein")
    .max(100, "Maximal 100 Zeichen"),
});
type TodoInput = z.infer<typeof TodoSchema>;

// --- HAUPTKOMPONENTE ---
export default function ToDoListManager({
  initialTodos = [],
}: {
  initialTodos?: any[];
}) {
  const [lists, setLists] = useState<ListInstance[]>([]);
  const [isTrashMode, setIsTrashMode] = useState(false);

  return (
    <>
      <TrashButton />
      {lists.map((list) => (
        <IndividualToDoList
          key={list.id}
          list={list}
          isTrashMode={isTrashMode}
          initialTodos={initialTodos.filter((t) => t.todoListId === list.id)}
          onDeleteMe={() =>
            setLists((prev) => prev.filter((l) => l.id !== list.id))
          }
        />
      ))}
    </>
  );
}

// --- EINZELNE KARTE ---
export function IndividualToDoList({
  list,
  isTrashMode: propTrashMode, // <-- Umbenannt, um Konflikte mit dem State zu vermeiden
  onDeleteMe,
  initialTodos = [],
}: {
  list: ListInstance;
  isTrashMode: boolean;
  onDeleteMe: () => void;
  initialTodos?: Todo[];
}) {
  const [todos, setTodos] = useState<any[]>(initialTodos);
  const [title, setTitle] = useState(list.title);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<any | null>(null);
  const [editValue, setEditValue] = useState("");

  // State für den globalen Löschmodus der Kollegen
  const [isTrashMode, setIsTrashMode] = useState(false);

  useEffect(() => {
    const handleSync = (e: Event) => {
      setIsTrashMode((e as CustomEvent).detail.isTrashMode);
    };
    window.addEventListener("milanote-trash-sync", handleSync);
    return () => window.removeEventListener("milanote-trash-sync", handleSync);
  }, []);

  const form = useForm<TodoInput>({
    resolver: zodResolver(TodoSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (data: TodoInput) => {
    const newTodo = await createTodo(data.text, "board-1", list.id);

    if (newTodo) {
      setTodos([
        ...todos,
        {
          id: newTodo.id,
          text: newTodo.content,
          completed: false,
          todoListId: list.id,
        },
      ]);
      form.reset();
    }
  };

  const handleToggle = async (todo: any) => {
    const newStatus = !todo.completed;
    setTodos(
      todos.map((t) => (t.id === todo.id ? { ...t, completed: newStatus } : t)),
    );
    await toggleTodo(todo.id, newStatus);
  };

  const handleDeleteTodo = async (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
    await deleteTodoList(id); // Hier wird jetzt die richtige Server-Action aufgerufen
  };

  // Klick auf die gesamte Karte (für den globalen Trash-Mode der Kollegen)
  const handleCardClick = () => {
    if (isTrashMode) {
      window.dispatchEvent(
        new CustomEvent("milanote-request-delete", {
          detail: {
            title: title || "To-Do Liste",
            onConfirm: () => onDeleteMe(),
          },
        }),
      );
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`w-[300px] shadow-2xl rounded-lg p-4 bg-[#282828] text-gray-200 border border-[#383838] ${isTrashMode ? "border-red-500 cursor-pointer" : ""}`}
    >
      <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
        <input
          aria-label="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent font-semibold w-full outline-none"
          disabled={isTrashMode}
          onPointerDown={(e) => e.stopPropagation()} // Verhindert Dragging beim Text-Markieren
        />

        {/* Der kleine Trash-Button in der Liste */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Verhindert, dass der Card-Klick ausgelöst wird
            onDeleteMe();
          }}
          onPointerDown={(e) => e.stopPropagation()} // Verhindert, dass das Board-Drag ausgelöst wird
          className="text-gray-500 hover:text-red-500 ml-2 transition-colors"
          title="Liste löschen"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>

      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-center justify-between py-1.5 hover:bg-white/5 rounded px-1 group"
        >
          <div
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={(e) => {
              e.stopPropagation();
              if (!isTrashMode) handleToggle(todo);
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {todo.completed ? (
              <CheckSquare className="w-4 h-4 text-gray-500" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            <span
              className={
                todo.completed ? "line-through text-gray-500" : "text-gray-200"
              }
            >
              {todo.text || todo.content}
            </span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                setTodoToEdit(todo);
                setEditValue(todo.text || todo.content);
                setIsEditDialogOpen(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Pen className="w-3 h-3" />
            </Button>

            {/* Trash-Button für einzelne Aufgaben */}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteTodo(todo.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Trash className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}

      <form
        onSubmit={(e) => {
          e.stopPropagation();
          form.handleSubmit(onSubmit)(e);
        }}
        className="mt-3"
      >
        <Input
          {...form.register("text")}
          aria-label="Neue Aufgabe"
          placeholder="Add a task..."
          className="bg-[#1a1a1a] border-gray-600 text-xs"
          disabled={isTrashMode}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </form>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#2a2a2a] border-[#383838]">
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          </DialogHeader>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="bg-[#1a1a1a]"
          />
          <DialogFooter>
            <Button
              onClick={() => {
                setTodos(
                  todos.map((t) =>
                    t.id === todoToEdit?.id ? { ...t, text: editValue } : t,
                  ),
                );
                setIsEditDialogOpen(false);
              }}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
