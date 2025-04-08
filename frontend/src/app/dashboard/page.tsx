"use client";

import { MovieGrid } from "@/app/components/MovieGrid";
import Cookies from "js-cookie";
import useAuthCheck from "@/hooks/useAuthCheck"; // Adjust path

export default function Dashboard() {
  const language = Cookies.get("language") || "en";
  useAuthCheck();

  return (
    <main>
      <div className="container mx-auto p-2">
        <MovieGrid language={language} />
      </div>
    </main>
  );
}
