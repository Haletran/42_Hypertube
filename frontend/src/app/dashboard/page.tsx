"use client";

import { MovieGrid } from "@/app/components/MovieGrid";
import { Navbar } from "@/app/components/ui/navbar";


export default function Dashboard() {
  return (
    <main>
      <div className="container mx-auto p-2">
          <Navbar />
          <MovieGrid />
      </div>
    </main>
  );
}
