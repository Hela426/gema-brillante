import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireProfile() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/acceso");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, role")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new Error("No se pudo cargar tu perfil de usuario.");
  }

  return {
    supabase,
    user,
    profile,
  };
}

export async function requireMaster() {
  const result = await requireProfile();

  if (result.profile.role !== "master") {
    redirect("/");
  }

  return result;
}

export async function requireCharacter() {
  const result = await requireProfile();

  const { data: character, error } = await result.supabase
    .from("characters")
    .select("id, name, handle, avatar_url")
    .eq("owner_id", result.user.id)
    .eq("character_type", "main")
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!character && result.profile.role !== "master") {
    redirect("/personajes/crear");
  }

  return {
    ...result,
    character,
  };
}
