import { Suspense } from "react";
import { requireCharacter } from "@/lib/auth";
import LibraryReader from "@/components/library-reader";

async function LibraryPage() {
  await requireCharacter();
  return <LibraryReader />;
}
export default function Page() {
  return <Suspense fallback={<p className="p-8">Abriendo la biblioteca...</p>}><LibraryPage /></Suspense>;
}
