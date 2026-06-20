"use server";

import { prisma } from "../../lib/prisma";
import { CreateTextSchema, type CreateTextInput } from "@/app/schema/text";
import { revalidatePath } from "next/cache";

export async function createText(input: CreateTextInput) {
  // 1. Zod-Validierung zur Laufzeit
  const validated = CreateTextSchema.parse(input);
  
  // 2. In die Postgres-Datenbank schreiben
  const newNote = await prisma.note.create({
    data: {
      content: validated.content || "", // Falls leer, leeren String speichern
      x: validated.x,
      y: validated.y,
      boardId: validated.boardId,
    },
  });
  
  // 3. Cache leeren, damit der neue get_node_Text direkt auf dem Board erscheint
  revalidatePath("/");
  
  return { success: true, data: newNote };
}