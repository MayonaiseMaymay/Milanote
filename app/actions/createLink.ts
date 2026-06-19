"use server";

import { CreateLinkSchema, type CreateLinkInput } from "@/app/schema/link";

export async function createLink(input: CreateLinkInput) {

  // 🔥 SERVER VALIDATION
  const validated = CreateLinkSchema.parse(input);

  // später: prisma speichern
  console.log("VALID:", validated);

  return validated;
}