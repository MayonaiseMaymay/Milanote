"use server";

import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function updatePosition(id: string, x: number, y: number) {
  try {
    // Falls deine IDs in der DB Integers sind, müssten wir hier parseInt(id) nutzen.
    // Wir versuchen es zuerst nativ mit dem übergebenen Typ:
    const updated = await prisma.note.update({
      where: { id: id as any }, 
      data: { x, y },
    });

    // Wichtig: Auch nach dem Verschieben den Cache invalidieren
    revalidatePath("/");
    
    return { success: true, data: updated };
  } catch (error) {
    console.error("❌ FEHLER in updatePosition Server Action:", error);
    return { success: false, error: String(error) };
  }
}