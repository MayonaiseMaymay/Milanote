import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  // 1. Suche nach dem ersten Haupt-Board des Nutzers
  let firstBoard = await prisma.board.findFirst({
    where: {
      userId: "user-1", // Später kommt hier die echte eingeloggte User-ID hin
      parentId: null, // Wir wollen nur Haupt-Boards, keine Sub-Boards
    },
  });

  // 2. Wenn es noch gar kein Board gibt, legen wir dynamisch eines an
  if (!firstBoard) {
    firstBoard = await prisma.board.create({
      data: {
        title: "Game project",
        user: {
          connectOrCreate: {
            where: { id: "user-1" },
            create: { id: "user-1", email: "test@example.com" },
          },
        },
      },
    });
  }

  // 3. Leite auf die echte, dynamische ID weiter (z.B. /board/clkj12345...)
  redirect(`/board/${firstBoard.id}`);
}
