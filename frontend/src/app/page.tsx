"use client";

import { MovieSearch } from "@/app/components/MovieGrid";

export default function Home() {
  return (
    <main>
      <h1 className="text-4xl font-bold text-center mt-8">Hypertube</h1>
      <MovieSearch />
    </main>
  );
}
