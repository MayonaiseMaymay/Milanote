"use server";

import { CreateLinkSchema, type CreateLinkInput } from "@/app/schema/link";
import { revalidatePath } from "next/cache";

export async function createLink(input: CreateLinkInput) {

  // 🔥 SERVER VALIDATION
  const validated = CreateLinkSchema.parse(input);

  // später: prisma speichern
  console.log("VALID:", validated);

  // Cache für das Board invalidieren (schon mal vorbereitet für später)
  revalidatePath("/");

  return validated;
}