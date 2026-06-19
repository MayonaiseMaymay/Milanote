"use client";

import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TrashButton() {
  const [isTrashMode, setIsTrashMode] = useState(false);

  // Hält die Informationen für das aktuelle Element, das gelöscht werden soll
  const [deleteRequest, setDeleteRequest] = useState<{
    title: string;
    onConfirm: () => void;
  } | null>(null);

  // --- 1. KLICK-ABFANG-LOGIK FÜR DIE SIDEBAR ---
  useEffect(() => {
    const handleSidebarClicks = (e: MouseEvent) => {
      const aside = document.querySelector("aside");
      if (!aside || !aside.contains(e.target as Node)) return;

      const buttonContainer = (e.target as HTMLElement).closest(
        ".cursor-pointer",
      );
      if (!buttonContainer) return;

      const text = buttonContainer.textContent?.trim() || "";

      if (text.includes("Trash") || text.includes("Aktiv")) {
        e.preventDefault();
        e.stopPropagation();

        setIsTrashMode((prev) => {
          const nextState = !prev;
          // Sende den neuen Zustand per Event an alle Nodes (To-do, Text, etc.)
          window.dispatchEvent(
            new CustomEvent("milanote-trash-sync", {
              detail: { isTrashMode: nextState },
            }),
          );
          return nextState;
        });
      }
    };

    window.addEventListener("click", handleSidebarClicks, true);
    return () => window.removeEventListener("click", handleSidebarClicks, true);
  }, []);

  // --- 2. TRASH-BUTTON DYNAMISCH ROT FÄRBEN ---
  useEffect(() => {
    const buttons = document.querySelectorAll("aside .cursor-pointer");
    buttons.forEach((btn) => {
      const textSpan = btn.querySelector("span");
      const text = textSpan?.textContent?.trim() || "";

      if (text === "Trash" || text === "Aktiv") {
        const iconBox = btn.querySelector("div");
        if (iconBox && textSpan) {
          if (isTrashMode) {
            btn.classList.add("text-red-400");
            iconBox.classList.add(
              "bg-red-950/40",
              "border",
              "border-red-900/50",
            );
            textSpan.textContent = "Aktiv";
          } else {
            btn.classList.remove("text-red-400");
            iconBox.classList.remove(
              "bg-red-950/40",
              "border",
              "border-red-900/50",
            );
            textSpan.textContent = "Trash";
          }
        }
      }
    });
  }, [isTrashMode]);

  // --- 3. LAUSCHEN AUF LÖSCH-ANFRAGEN VON ALLEN NODES ---
  useEffect(() => {
    const handleDeletionRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{
        title: string;
        onConfirm: () => void;
      }>;
      // Dialog öffnen und Daten speichern
      setDeleteRequest({
        title: customEvent.detail.title,
        onConfirm: customEvent.detail.onConfirm,
      });
    };

    window.dispatchEvent(
      new CustomEvent("milanote-trash-sync", { detail: { isTrashMode } }),
    );
    window.addEventListener("milanote-request-delete", handleDeletionRequest);
    return () =>
      window.removeEventListener(
        "milanote-request-delete",
        handleDeletionRequest,
      );
  }, [isTrashMode]);

  const handleExecuteDelete = () => {
    if (deleteRequest) {
      deleteRequest.onConfirm(); // Führt die Löschfunktion des jeweiligen Nodes aus
      setDeleteRequest(null);
    }
  };

  return (
    <>
      {/* Globaler Banner über dem Board */}
      {isTrashMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-destructive/20 border border-destructive/40 text-destructive-foreground text-xs font-medium px-4 py-1.5 rounded-full shadow-lg z-[100] animate-pulse pointer-events-none">
          Löschmodus active: Klicke auf ein Element, um es zu entfernen.
        </div>
      )}

      {/* DER ZENTRALE DIALOG FÜR ALLE NODES IM PROJEKT */}
      <Dialog
        open={deleteRequest !== null}
        onOpenChange={(open) => !open && setDeleteRequest(null)}
      >
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-md bg-[#2a2a2a] border-[#383838] text-gray-200"
        >
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2 text-sm font-semibold">
              <Trash2 className="w-4 h-4" /> Element löschen?
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 text-gray-400">
              Bist du sicher, dass du „
              {deleteRequest?.title || "dieses Element"}“ permanent löschen
              möchtest?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 hover:text-white"
              onClick={() => setDeleteRequest(null)}
            >
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={handleExecuteDelete}>
              Ja, löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* an ALLE!!!

folgendes in euren node script/datei einfügen, damit man eure node löschen kann 

const [isTrashMode, setIsTrashMode] = useState(false);

useEffect(() => {
  const handleSync = (e: Event) => {
    setIsTrashMode((e as CustomEvent).detail.isTrashMode);
  };
  window.addEventListener("milanote-trash-sync", handleSync);
  return () => window.removeEventListener("milanote-trash-sync", handleSync);
}, []);

const handleNoteClick = () => {
  if (isTrashMode) {
    window.dispatchEvent(new CustomEvent("milanote-request-delete", {
      detail: {
        title: "Mein Notizzettel",
        onConfirm: () => deleteNoteFromBoard() // Funktion deines Kollegen zum Löschen
      }
    }));
  }
};

*/
