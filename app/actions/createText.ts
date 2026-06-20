"use server";

import { CreateTextSchema, type CreateTextInput } from "@/app/schema/text";
// import { prisma } from "@/lib/prisma"; <-- Das kommentieren wir erstmal aus, bis die DB steht

export async function createText(input: CreateTextInput) {
  // Validierung zur Laufzeit! Wirft einen Error, falls der Text z.B. zu lang ist
  const validated = CreateTextSchema.parse(input);
  
  console.log("Erfolgreich auf dem Server validiert:", validated);

  // Später kommt hier das rein:
  // return prisma.textNode.create({ data: validated });
  
  return { success: true, data: validated };
}