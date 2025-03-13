"use client";

import { MovieSearch } from "@/app/components/MovieGrid";
import { Navbar } from "@/app/components/ui/navbar";
import { SearchBar } from "@/app/components/SearchBar";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto p-4">
        <Navbar />
        <SearchBar />
        <MovieSearch />
      </div>
    </main>
  );
}
