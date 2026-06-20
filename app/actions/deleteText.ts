"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteText(id: string) {
  try {
    await prisma.note.delete({
      where: { id: id as any },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("❌ FEHLER in deleteText Server Action:", error);
    return { success: false, error: String(error) };
  }
}