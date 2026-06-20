import { z } from "zod";

export const CreateTextSchema = z.object({
  text: z.string()
    .max(500, "Puh, das ist etwas zu lang! Maximal 500 Zeichen erlaubt.")
    .optional(), // optional, da die Notiz am Anfang ja noch leer ist
});

// TypeScript-Typ automatisch generieren lassen
export type CreateTextInput = z.infer<typeof CreateTextSchema>;