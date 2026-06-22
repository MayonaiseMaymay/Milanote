import GetNodeBoard from "@/components/ui/get_node_Board";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Breadcrumb = { id: string; title: string };

// 1. Breadcrumbs rekursiv laden
async function getBreadcrumbs(boardId: string): Promise<Breadcrumb[]> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, title: true, parentId: true },
  });
  if (!board) return [];
  if (board.parentId) {
    const parentCrumbs = await getBreadcrumbs(board.parentId);
    return [...parentCrumbs, { id: board.id, title: board.title }];
  }
  return [{ id: board.id, title: board.title }];
}

// 2. Tab-Titel dynamisch generieren
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const board = await prisma.board.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: board ? `${board.title} | Milanote` : "Board" };
}

// 3. Die eigentliche, dynamische Board-Zentrale
export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const boardId = id; // Hier ist id jetzt sicher definiert, da wir auf /board/[id] sind!

  // Basis-Boarddaten laden
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      notes: true,
      subBoards: true,
    },
  });

  if (!board) return notFound();

  // Holt die To-Dos passend für dieses spezifische Board
  const dbTodoLists = await prisma.todoList.findMany({
    where: { boardId: boardId },
  });
  const dbTodos = await prisma.todo.findMany({
    where: { boardId: boardId },
  });

  const breadcrumbs = await getBreadcrumbs(boardId);

  // Daten für das UI aufbereiten
  const initialNodes = board.notes.map((note) => ({
    id: note.id,
    x: note.x,
    y: note.y,
    content: note.content || "",
  }));

  const initialSubBoards = ((board.subBoards as any[]) ?? []).map(
    (sb: any) => ({
      id: sb.id,
      x: sb.x,
      y: sb.y,
      title: sb.title,
      cardCount: 0,
    }),
  );

  // Übersetzt content (DB) zu text (UI)
  const formattedTodos = dbTodos.map((todo: any) => ({
    id: todo.id,
    text: todo.content,
    completed: todo.completed,
    todoListId: todo.todoListId,
  }));

  return (
    <div className="w-screen h-screen overflow-hidden">
      <GetNodeBoard
        key={boardId}
        boardId={boardId}
        breadcrumbs={breadcrumbs}
        initialNodes={initialNodes}
        initialSubBoards={initialSubBoards}
        initialTodos={formattedTodos}
        initialTodoLists={dbTodoLists}
      />
    </div>
  );
}
