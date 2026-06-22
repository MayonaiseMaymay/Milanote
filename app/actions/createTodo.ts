"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTodo(
  content: string,
  boardId: string,
  todoListId: string,
) {
  try {
    const todo = await prisma.todo.create({
      data: { content, boardId, todoListId, completed: false },
    });
    revalidatePath("/");
    return todo;
  } catch (error) {
    console.error("Fehler beim Speichern des Todos:", error);
    return null;
  }
}
