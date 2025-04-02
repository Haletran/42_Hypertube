"use client";

import { MovieGrid } from "@/app/components/MovieGrid";

export default function Dashboard() {
  return (
    <main>
      <div className="container mx-auto p-2">
          <MovieGrid />
      </div>
    </main>
  );
}
