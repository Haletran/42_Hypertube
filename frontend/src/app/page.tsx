"use client";

import { MovieSearch } from "@/app/components/MovieGrid";
import { SearchBar } from "@/app/components/SearchBar";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto p-4">
        <SearchBar />
        <MovieSearch />
      </div>
    </main>
  );
}
