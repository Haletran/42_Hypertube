"use client";

import { MovieGrid } from "@/app/components/MovieGrid";
import { SearchBar } from "@/app/components/SearchBar";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto p-2">
        <SearchBar />
        <MovieGrid />
      </div>
    </main>
  );
}
