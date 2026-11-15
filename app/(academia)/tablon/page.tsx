import { Suspense } from "react";
import Link from "next/link";

import SocialPanel from "@/components/social-panel";

import { MessageCircle, Bookmark, Flower2 } from "lucide-react";

type Props = {
  searchParams: Promise<{
    vista?: string;
  }>;
};

async function SocialPage({ searchParams }: Props) {
  const { vista } = await searchParams;

  const savedOnly = vista === "guardadas";

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <section
          className="academy-banner
          rounded-3xl border border-(--border) p-8"
        >
          <Flower2 size={42} strokeWidth={1.2} className="text-(--gold)" />

          <p
            className="text-xs uppercase
            tracking-widest text-(--accent) mt-4"
          >
            Academia Gema Brillante
          </p>

          <h1 className="text-5xl mt-3">Ecos de la sociedad</h1>

          <p
            className="text-sm italic
            text-(--muted) mt-4"
          >
            Las palabras también pueden cambiar el destino.
          </p>
        </section>

        <div
          className="academy-card p-2
          flex items-center gap-2"
        >
          <Link
            href="/tablon"
            className={`flex-1 rounded-xl p-3
              flex items-center justify-center gap-2
              text-sm ${!savedOnly ? "bg-(--lavender)" : ""}`}
          >
            <MessageCircle size={18} />
            Tablón social
          </Link>

          <Link
            href="/tablon?vista=guardadas"
            className={`flex-1 rounded-xl p-3
              flex items-center justify-center gap-2
              text-sm ${savedOnly ? "bg-(--lavender)" : ""}`}
          >
            <Bookmark size={18} />
            Guardadas
          </Link>
        </div>

        <SocialPanel savedOnly={savedOnly} />
      </div>
    </main>
  );
}

export default function Page({ searchParams }: Props) {
  return (
    <Suspense
      fallback={<p className="p-8">Abriendo los ecos de la sociedad...</p>}
    >
      <SocialPage searchParams={searchParams} />
    </Suspense>
  );
}
