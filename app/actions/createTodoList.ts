"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTodoList(
  id: string,
  x: number,
  y: number,
  boardId: string,
) {
  try {
    const newList = await prisma.todoList.create({
      data: {
        id: id,
        title: "Neue To-Do Liste",
        x: Math.round(x),
        y: Math.round(y),
        boardId: boardId,
      },
    });
    revalidatePath("/");
    return { success: true, data: newList };
  } catch (error) {
    console.error("Fehler beim Erstellen der Todo-Liste:", error);
    return { success: false };
  }
}
