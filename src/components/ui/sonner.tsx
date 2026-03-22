"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        className: "!bg-zinc-900 !border-zinc-800 !text-white",
      }}
      richColors
      closeButton
    />
  );
}
