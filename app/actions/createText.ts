"use server";
import { prisma } from "../../lib/prisma";
import { CreateTextSchema, type CreateTextInput } from "@/app/schema/text";
import { revalidatePath } from "next/cache";

export async function createText(input: CreateTextInput) {
  const validated = CreateTextSchema.parse(input);

  // Sicherheitsnetz falls DB leer ist
  await prisma.board.upsert({
    where: { id: "board-1" },
    update: {},
    create: {
      id: "board-1",
      title: "Game project",
      user: {
        connectOrCreate: {
          where: { id: "user-1" },
          create: { id: "user-1", email: "test@example.com" },
        },
      },
    },
  });

  const newNote = await prisma.note.create({
    data: {
      content: validated.content || "",
      x: validated.x,
      y: validated.y,
      boardId: validated.boardId, // Muss "board-1" sein
    },
  });

  revalidatePath("/");
  return { success: true, data: newNote };
}
