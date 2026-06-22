"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateTodoListPosition(id: string, x: number, y: number) {
  try {
    const updated = await prisma.todoList.update({
      where: { id },
      data: {
        x: Math.round(x),
        y: Math.round(y),
      },
    });
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (error) {
    console.error("FEHLER in updateTodoListPosition:", error);
    return { success: false };
  }
}
