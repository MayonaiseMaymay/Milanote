"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteTodoList(id: string) {
  try {
    await prisma.todoList.delete({
      where: { id: id },
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Fehler beim Löschen der Todo-Liste:", error);
    return { success: false };
  }
}
