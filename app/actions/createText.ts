"use server";

import { prisma } from "../../lib/prisma";
import { CreateTextSchema, type CreateTextInput } from "@/app/schema/text";

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
  
  return { success: true, data: newNote };
}