"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  CreateLinkSchema,
  type CreateLinkInput,
} from "@/app/schema/link";

import { createLink } from "@/app/actions/createLink";

// ================= TYPE =================
// Typ für dein Link-Objekt (Node im Board)
export type LinkType = {
  id: string;
  x: number;
  y: number;
  url: string;
};

// ================= PROPS =================
type LinkNodeProps = {
  link: LinkType;
  setLinks: React.Dispatch<React.SetStateAction<LinkType[]>>;
};

// ================= COMPONENT =================
export default function LinkNode({ link, setLinks }: LinkNodeProps) {
  
  // ================= FORM =================
  const form = useForm<CreateLinkInput>({
    resolver: zodResolver(CreateLinkSchema),
    defaultValues: {
      url: link.url || "",
      x: link.x,
      y: link.y,
    },
  });

  // ================= SUBMIT =================
  async function onSubmit(data: CreateLinkInput) {
    
    // 🔥 Server Validierung
    await createLink(data);

    // 🔥 Lokalen State updaten
    setLinks((prev) =>
      prev.map((l) =>
        l.id === link.id
          ? { ...l, url: data.url }
          : l
      )
    );
  }

  // ================= UI =================
  return (
    <form onBlur={form.handleSubmit(onSubmit)}>

      {/* INPUT */}
      <input
        {...form.register("url")}
        placeholder="https://..."
        className="w-full bg-transparent outline-none text-sm"
      />

      {/* ERROR MESSAGE */}
      {form.formState.errors.url && (
        <p className="text-red-500 text-xs">
          {form.formState.errors.url.message}
        </p>
      )}

      {/* PREVIEW LINK */}
      {form.watch("url") && (
        <a
          href={form.watch("url")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 text-xs underline break-all"
        >
          Open Link
        </a>
      )}

    </form>
  );
}