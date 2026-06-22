"use server";
import { prisma } from "../../lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSubBoardTitle(id: string, title: string, parentId: string) {
  await prisma.board.update({
    where: { id },
    data: { title },
  });

  revalidatePath(`/board/${parentId}`);
  return { success: true };
}