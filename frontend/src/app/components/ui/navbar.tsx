"use client"
import Link from "next/link"
import { useContext, useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { DownloadBar } from "../DownloadBar"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { AuthContext } from '@/contexts/AuthContext';
import { Search, LogOut, Settings, User } from "lucide-react"
import api from '@/utils/api';
import Cookies from 'js-cookie';


export function Navbar() {
    const auth = useContext(AuthContext);
    const [profile_picture, setProfilePicture] = useState('');
    const [name, setName] = useState('');


    const logout = async () => {
        try {
            if (!auth) throw new Error('Auth context not found');
            await auth.logout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = Cookies.get('token');
                const response = await api.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
                setProfilePicture(response.data.user.profilePicture || '');
                setName(response.data.user.username);
            } catch (error) {
                console.error('Failed to get user:', error);
            }
        };
        fetchUserData();
    }, []);
    
    return (
        <div className="container mx-auto p-4">
            <header className="sticky top-0 z-50 w-full  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/dashboard" className="flex items-center" onClick={(e) => {
                        e.preventDefault();
                        window.location.href = '/dashboard';
                    }}>
                        <h1 className="text-xl font-bold tracking-tight">Hypertube</h1>
                    </Link>
                    <DropdownMenu.Root>
                        <div className="flex items-center gap-4">
                            <Link href="/search" className="text-muted-foreground">
                                <Search className="text-muted-foreground size-4" />
                            </Link>
                            <DropdownMenu.Trigger asChild>
                                <Avatar>
                                    <AvatarImage src={profile_picture} />
                                    <AvatarFallback>{name ? name.charAt(0).toUpperCase() : ''}</AvatarFallback>
                                </Avatar>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="w-64 bg-zinc-900 border border-zinc-800 rounded-md p-1 shadow-xl z-50 animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                                    sideOffset={8}
                                    align="end"
                                    alignOffset={-5}
                                >
                                    <div className="px-3 py-2 border-b border-zinc-800">
                                        <div className="font-medium text-sm">{name}</div>
                                    </div>
                                    <div className="py-1">
                                        <DropdownMenu.Item asChild>
                                            <Link
                                                href="/user/profile"
                                                className="flex items-center px-3 py-2 text-sm rounded-sm hover:bg-zinc-800 focus:bg-zinc-800 outline-none cursor-pointer"
                                            >
                                                <User className="mr-2 h-4 w-4 text-zinc-400" />
                                                <span>Profile</span>
                                            </Link>
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item asChild>
                                            <Link
                                                href="/user/settings"
                                                className="flex items-center px-3 py-2 text-sm rounded-sm hover:bg-zinc-800 focus:bg-zinc-800 outline-none cursor-pointer"
                                            >
                                                <Settings className="mr-2 h-4 w-4 text-zinc-400" />
                                                <span>Settings</span>
                                            </Link>
                                        </DropdownMenu.Item>
                                    </div>
                                    <div className="pt-1 mt-1 border-t border-zinc-800">
                                        <DropdownMenu.Item
                                            className="flex items-center px-3 py-2 text-sm rounded-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 focus:bg-red-950/50 focus:text-red-300 outline-none cursor-pointer"
                                            onClick={logout}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </DropdownMenu.Item>
                                    </div>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </div>
                    </DropdownMenu.Root>
                </div>
            </header >
        </div >
    )
}

