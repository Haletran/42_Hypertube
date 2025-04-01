"use client";
import { useContext, useState, useEffect, use } from 'react';
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

  const github_url =  `https://github.com/login/oauth/authorize?scope=user:bpasquier123@gmail.com&client_id=` + process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const loginUrl = new URL('https://api.intra.42.fr/oauth/authorize');
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID;
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_CLIENT_ID is not defined');
  }
  loginUrl.searchParams.set('client_id', clientId);
  loginUrl.searchParams.set('redirect_uri', process.env.NEXT_PUBLIC_BACKEND_URL + '/api/oauth/42');
  loginUrl.searchParams.set('response_type', 'code');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (token) {
      try {
        const parsedToken = JSON.parse(token);
        console.log('Parsed Token:', parsedToken.token);
        if (token && auth) {
          auth.setToken(parsedToken.token);
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error('Failed to parse token:', error);
      }
    }
  }, [auth]);
  

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
        
        <Button onClick={() => window.location.href = `${loginUrl}`} className="mb-4 w-64 bg-blue-500 hover:bg-blue-600 text-white">Login with 42</Button>
        <Button onClick={() => window.location.href = `${github_url}`} className="mb-4 w-64 bg-blue-500 hover:bg-blue-600 text-white">Login with Github</Button>
        
        <Link href="/register" className="text-accent">Go to Register</Link>
    </div>
  );
}