"use server";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSubBoard(parentId: string, x: number, y: number) {
  try {
    const newBoard = await prisma.board.create({
      data: {
        title: "New Board",
        parentId: parentId,
        //TODO: no fixed userID like it is rn
        userId: "aaaa",
        x,
        y,
      },
    });

    revalidatePath(`/board/${parentId}`);
    return { success: true, data: newBoard };
  } catch (error) {
    // Falls nochmal was schiefgeht, sehen wir es jetzt sofort im Terminal!
    console.error("❌ Fehler beim Erstellen des Sub-Boards in der DB:", error);
    return { success: false };
  }
}