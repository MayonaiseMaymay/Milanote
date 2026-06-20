"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateText(id: string, content: string) {
  const updatedNote = await prisma.note.update({
    where: { id: id },
    data: { content: content },
  });

  revalidatePath("/"); // Cache invalidieren
  return { success: true, data: updatedNote };
}