"use client";
import { createClient } from "@supabase/supabase-js";

// Cliente do navegador (anon key). Usado só para enviar o arquivo
// direto pro Storage via URL assinada — não acessa dados sensíveis.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
