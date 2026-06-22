import GetNodeBoard from "@/components/ui/get_node_Board";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Erst Board sicherstellen
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

  // 2. Daten aus der Datenbank holen
  const dbNotes = await prisma.note.findMany({ where: { boardId: "board-1" } });
  const dbTodos = await prisma.todo.findMany({ where: { boardId: "board-1" } });
  // NEU: Todo-Listen aus der DB holen
  const dbTodoLists = await prisma.todoList.findMany({
    where: { boardId: "board-1" },
  });

  // 3. Daten formatieren
  const initialNodes = dbNotes.map((note: any) => ({
    id: note.id,
    x: note.x,
    y: note.y,
    content: note.content || "",
  }));

  const formattedTodos = dbTodos.map((todo: any) => ({
    id: todo.id,
    text: todo.content,
    completed: todo.completed,
    todoListId: todo.todoListId,
  }));

  // 4. An das Board übergeben
  return (
    <div className="w-screen h-screen overflow-hidden">
      <GetNodeBoard
        initialNodes={initialNodes}
        initialTodos={formattedTodos}
        initialTodoLists={dbTodoLists}
      />
    </div>
  );
}
