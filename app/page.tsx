import { redirect } from "next/navigation";

export default function Home() {
  // Leite den Nutzer direkt auf das erste Board weiter
  redirect("/board/board-1");
}