"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("gema-brillante-theme");

    const theme = savedTheme === "dark" ? "dark" : "light";

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  return <>{children}</>;
}
