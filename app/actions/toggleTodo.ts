"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleTodo(id: string, completed: boolean) {
  await prisma.todo.update({
    where: { id },
    data: { completed },
  });
  revalidatePath("/");
}
