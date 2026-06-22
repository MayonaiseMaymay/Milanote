"use client";

import React, { useState, useEffect } from "react";
import { Pen, Trash, Square, CheckSquare, AlertCircle } from "lucide-react"; // AlertCircle für Error-UI hinzugefügt
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
import { deleteTodoList } from "@/app/actions/deleteTodoList"; // KORRIGIERT: Klarer, korrekter Import-Kommentar für einzelne Aufgaben

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
  initialTodos?: Todo[]; // KORRIGIERT: Stark typisiert statt any[]
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
  isTrashMode: propTrashMode,
  onDeleteMe,
  initialTodos = [],
}: {
  list: ListInstance;
  isTrashMode: boolean;
  onDeleteMe: () => void;
  initialTodos?: Todo[]; // KORRIGIERT: Stark typisiert
}) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos); // KORRIGIERT: Stark typisiert statt any[]
  const [title, setTitle] = useState(list.title);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [todoToEdit, setTodoToEdit] = useState<Todo | null>(null); // KORRIGIERT: Stark typisiert statt any
  const [editValue, setEditValue] = useState("");

  const [isTrashMode, setIsTrashMode] = useState(false);

  // NEU: State für visuelle Fehlermeldungen im UI (Fehler-Feedback)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = (e: Event) => {
      setIsTrashMode((e as CustomEvent).detail.isTrashMode);
    };
    window.addEventListener("milanote-trash-sync", handleSync);
    return () => window.removeEventListener("milanote-trash-sync", handleSync);
  }, []);

  // NEU: Auto-Dismiss Timer für die Fehlermeldung (blendet sich nach 4 Sek aus)
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const form = useForm<TodoInput>({
    resolver: zodResolver(TodoSchema),
    defaultValues: { text: "" },
  });

  const onSubmit = async (data: TodoInput) => {
    setErrorMessage(null); // Vorherige Fehler zurücksetzen
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
    } else {
      // NEU: Visuelles Feedback, falls die Server-Action fehlschlägt
      setErrorMessage("Aufgabe konnte nicht gespeichert werden.");
    }
  };

  const handleToggle = async (todo: Todo) => {
    const newStatus = !todo.completed;
    setTodos(
      todos.map((t) => (t.id === todo.id ? { ...t, completed: newStatus } : t)),
    );

    const result = await toggleTodo(todo.id, newStatus);
    if (!result) {
      setErrorMessage("Status-Update fehlgeschlagen.");
      setTodos(
        todos.map((t) =>
          t.id === todo.id ? { ...t, completed: todo.completed } : t,
        ),
      );
    }
  };

  const handleDeleteTodo = async (id: string) => {
    const originalTodos = [...todos];
    setTodos(todos.filter((t) => t.id !== id));

    const result = await deleteTodoList(id);
    if (!result) {
      setErrorMessage("Aufgabe konnte nicht gelöscht werden.");
      setTodos(originalTodos); // Rollback im Fehlerfall
    }
  };

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
      className={`w-[300px] shadow-2xl rounded-lg p-4 bg-[#282828] text-gray-200 border border-[#383838] relative ${isTrashMode ? "border-red-500 cursor-pointer" : ""}`}
    >
      {/* NEU: Visueller Roter Toast/Banner direkt über der Karte bei Server-Fehlern */}
      {errorMessage && (
        <div className="absolute -top-10 left-0 right-0 bg-red-950/95 border border-red-800 text-red-200 text-[11px] px-3 py-1.5 rounded-md shadow-xl z-50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
        <input
          aria-label="Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent font-semibold w-full outline-none"
          disabled={isTrashMode}
          onPointerDown={(e) => e.stopPropagation()}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteMe();
          }}
          onPointerDown={(e) => e.stopPropagation()}
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
              {todo.text}
            </span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                setTodoToEdit(todo);
                setEditValue(todo.text);
                setIsEditDialogOpen(true);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Pen className="w-3 h-3" />
            </Button>

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
                if (todoToEdit) {
                  setTodos(
                    todos.map((t) =>
                      t.id === todoToEdit.id ? { ...t, text: editValue } : t,
                    ),
                  );
                }
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
