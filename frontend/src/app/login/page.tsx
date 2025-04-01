"use client";
import { useContext, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import Link from "next/link";

export default function LoginPage() {
  const auth = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
        try {
          if (!auth) throw new Error('Auth context not found');
          console.log('Logging in with:', email, password);
          await auth.login(email, password);
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('Login failed:', error);
        }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 p-2 border rounded w-64"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 p-2 border rounded w-64"
        />
        <Button onClick={handleLogin} className="mb-4 w-64">Login</Button>

        <Link href="/register" className="text-accent">Go to Register</Link>
    </div>
  );
}