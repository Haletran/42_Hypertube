"use client";

import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from "./login/page";

export default function Home() {
  return (
    <main>
      <div className="container mx-auto p-2">
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </div>
    </main>
  );
}
