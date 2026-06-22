"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleTodo(id: string, completed: boolean) {
  try {
    await prisma.todo.update({
      where: { id },
      data: { completed },
    });
    revalidatePath("/");
    return true; // <-- HIER: true zurückgeben
  } catch (error) {
    console.error("Fehler beim Updaten des Status:", error);
    return false; // <-- HIER: false zurückgeben
  }
}
