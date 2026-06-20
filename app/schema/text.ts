import { z } from "zod";

export const CreateTextSchema = z.object({
  // Zod prüft jetzt auf "content" statt "text", passend zum Prisma-Schema
  content: z.string()
    .max(500, "Puh, das ist etwas zu lang! Maximal 500 Zeichen erlaubt.")
    .optional(),
  
  // Die neuen Pflichtfelder für Position und Board-Zuordnung
  x: z.number(),
  y: z.number(),
  boardId: z.string(),
});

export type CreateTextInput = z.infer<typeof CreateTextSchema>;