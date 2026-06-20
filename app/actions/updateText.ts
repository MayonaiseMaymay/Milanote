"use server";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateText(id: string, content: string) {
  try {
    const updatedNote = await prisma.note.update({
      where: { id: id },
      data: { content: content },
    });

    revalidatePath("/");
    return { success: true, data: updatedNote };
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    return { success: false };
  }
}
