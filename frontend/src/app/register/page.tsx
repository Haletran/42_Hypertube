"use client";
import { useContext, useState } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import Link from "next/link";


export default function LoginPage() {
  const auth = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
        try {
          if (!auth) throw new Error('Auth context not found');
          await auth.register(username, email, password);
          window.location.href = '/dashboard';
        } catch (error) {
          console.error('Register failed:', error);
        }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Register</h1>
        <input 
            className="mb-2 p-2 border rounded w-64"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />
        <input
            className="mb-2 p-2 border rounded w-64"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <input
            className="mb-4 p-2 border rounded w-64"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <Button className="mb-2 w-64" onClick={handleLogin}>Register</Button>
        <Link href="/login" className="text-accent">Go to Login</Link>
    </div>
  );
}