"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import LandingPage from "./landingpage";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto">
        <AuthProvider>
          <LandingPage />
        </AuthProvider>
      </div>
    </main>
  );
}
