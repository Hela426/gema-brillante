import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { requireCharacter } from "@/lib/auth";
import SecretManager from "@/components/secret-manager";
import ThemeToggle from "@/components/theme-toggle";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

async function PrivateArchive({ params }: Props) {
  const { supabase, user, profile } = await requireCharacter();

  const { id } = await params;

  const { data: person, error } = await supabase
    .from("characters")
    .select("id, name, owner_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!person) notFound();

  if (person.owner_id !== user.id && profile.role !== "master") {
    redirect(`/personajes/${id}`);
  }

  const [secretResult, recipientResult] = await Promise.all([
    supabase
      .from("character_secrets")
      .select("*")
      .eq("character_id", id)
      .order("created_at", { ascending: false }),

    supabase
      .from("characters")
      .select("owner_id, name")
      .eq("character_type", "main")
      .eq("status", "approved")
      .order("name"),
  ]);

  if (secretResult.error) {
    throw new Error(secretResult.error.message);
  }

  if (recipientResult.error) {
    throw new Error(recipientResult.error.message);
  }

  const secrets = secretResult.data || [];
  const recipients = recipientResult.data || [];

  let permissions: {
    secret_id: string;
    user_id: string;
  }[] = [];

  if (secrets.length > 0) {
    const { data, error } = await supabase
      .from("secret_access")
      .select("secret_id, user_id")
      .in(
        "secret_id",
        secrets.map((s) => s.id),
      );

    if (error) throw new Error(error.message);

    permissions = data || [];
  }

  return (
    <main className="min-h-screen p-5 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center">
          <Link
            href={`/personajes/${id}`}
            className="flex items-center gap-2
              text-sm text-(--accent)"
          >
            <ArrowLeft size={18} />
            Volver al perfil
          </Link>

          <ThemeToggle />
        </header>

        <div className="text-center my-10">
          <LockKeyhole
            size={42}
            strokeWidth={1.2}
            className="mx-auto text-(--gold)"
          />

          <h1 className="text-5xl mt-5">Archivo privado</h1>

          <p className="text-(--accent) mt-3">{person.name}</p>

          <div className="floral-divider my-6">❀</div>

          <p className="text-sm italic text-(--muted)">
            Hay historias que solo florecen en secreto.
          </p>
        </div>

        <SecretManager
          characterId={id}
          ownerId={person.owner_id}
          currentUserId={user.id}
          secrets={secrets}
          recipients={recipients}
          permissions={permissions}
        />
      </div>
    </main>
  );
}

export default function Page({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8">Cargando archivos...</p>}>
      <PrivateArchive params={params} />
    </Suspense>
  );
}
