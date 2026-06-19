import { z } from "zod";

// ================= LINK VALIDATION =================
export const CreateLinkSchema = z.object({
  url: z
    .string()
    .url("Ungültige URL")
    .min(1, "URL ist erforderlich"),

  x: z.number(),
  y: z.number(),
});

// 👉 automatisch TypeScript Typ
export type CreateLinkInput = z.infer<typeof CreateLinkSchema>;