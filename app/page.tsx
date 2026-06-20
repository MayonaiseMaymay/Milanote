import GetNodeBoard from "@/components/ui/get_node_Board";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 1. Alle gespeicherten Notes aus der Datenbank holen
  const dbNotes = await prisma.note.findMany();

  // 2. Daten so formatieren, wie dein Board sie erwartet
  const initialNodes = dbNotes.map(note => ({
    id: note.id,
    x: note.x,
    y: note.y,
    content: note.content || "", // <-- JETZT AKTIV: Text aus der DB mitgeben
  }));

  return (
    <div className="w-screen h-screen overflow-hidden">
      {/* 3. Start-Daten an das Board übergeben */}
      <GetNodeBoard initialNodes={initialNodes} />
    </div>
  );
}