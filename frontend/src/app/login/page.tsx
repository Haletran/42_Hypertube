"use client";
import React from 'react';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"


interface LoginUser {
    params: {
        email: string;
        password: string;
    }
}


interface RegisterUser {
    params: {
        username: string;
        email: string;
        password: string;
    }
}

async function login({ params }: LoginUser) {
    try {
        const response = await fetch('http://localhost:3333/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            return response.json();
        }

        const data = await response.json();
        if (data.errors) {
            return data.errors;
        }
        console.log('Logged in successfully');
        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}


async function register({ params }: RegisterUser) {
    try {
        const response = await fetch('http://localhost:3333/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            return response.json();
        }

        const data = await response.json();
        if (data.errors) {
            return data.errors;
        }
        console.log('Logged in successfully');
        return data;
    } catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
}



export default function Auth() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [error, setError] = React.useState<string[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleLogin = async () => {
        setError([]);
        setIsLoading(true);
        try {
            const result = await login({ params: { email, password } });
            if (result.errors) {
                setError(result.errors.map((err: any) => err.message));
                return;
            }
        } catch (error) {
            console.error("Failed to login:", error);
            setError(['An unexpected error occurred']);
        } finally {
            setIsLoading(false);
        }
    }

    const handleRegister = async () => {
        setError([]);
        setIsLoading(true);
        try {
            const result = await register({ params: { username, email, password } });
            if (result.errors) {
                setError(result.errors.map((err: any) => err.message));
                return;
            }
        } catch (error) {
            console.error("Failed to register:", error);
            setError(['An unexpected error occurred']);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="container mx-auto p-4">
            <Tabs defaultValue="account" className="w-[400px]">
                <TabsList>
                    <TabsTrigger value="account">Login</TabsTrigger>
                    <TabsTrigger value="password">Register</TabsTrigger>
                </TabsList>
                <TabsContent value="account" className="pt-4">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
                        <div className="space-y-3">
                            <Input
                                type="text"
                                placeholder="Email"
                                className="w-full p-2 rounded-md"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="w-full p-2 rounded-md"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {error.length > 0 && (
                                <div className=" text-red-500 p-2 rounded-md">
                                    {error.map((err, index) => (
                                        <div key={index}>{index + 1}. {err}</div>
                                    ))}
                                </div>
                            )}
                            <Button
                                onClick={handleLogin}
                                className="w-full mt-4 py-2 bg-white text-gray-950   hover:bg-gray-400 transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="password" className="pt-4">
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>
                        <div className="space-y-3">
                            <Input
                                type="email"
                                placeholder="Email"
                                className="w-full p-2 rounded-md"
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Input
                                type="text"
                                placeholder="Username"
                                className="w-full p-2 rounded-md"
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                className="w-full p-2 rounded-md"
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {error.length > 0 && (
                                <div className=" text-red-500 p-2 rounded-md">
                                    {error.map((err, index) => (
                                        <div key={index}>{index + 1}. {err}</div>
                                    ))}
                                </div>
                            )}
                            <Button
                                onClick={handleRegister}
                                className="w-full mt-4 py-2 bg-white text-gray-950   hover:bg-gray-400 transition-colors"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Registering...' : 'Register'}
                            </Button>

                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}