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
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const board = await prisma.board.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: board ? `${board.title} | Milanote` : "Board" };
}

// 3. Die eigentliche Seite
export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const boardId = id;

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      notes: true,
      subBoards: true,
    },
  });

  if (!board) return notFound();

  // ---> HIER WAR DIE FEHLENDE ZEILE! <---
  const breadcrumbs = await getBreadcrumbs(boardId);

  const initialNodes = board.notes.map((note) => ({
    id: note.id,
    x: note.x,
    y: note.y,
    content: note.content || "",
  }));

  const initialSubBoards = (board.subBoards ?? []).map((sb: any) => ({
    id: sb.id,
    x: sb.x,
    y: sb.y,
    title: sb.title,
    cardCount: 0,
  }));

  return (
    <div className="w-screen h-screen overflow-hidden">
      <GetNodeBoard
        key={boardId} // Der magische Reload-Fix
        boardId={boardId}
        breadcrumbs={breadcrumbs} // Jetzt ist die Variable wieder da!
        initialNodes={initialNodes}
        initialSubBoards={initialSubBoards}
      />
    </div>
  );
}