"use client"

import Link from "next/link"
import { useContext, useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { DownloadBar } from "../DownloadBar"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { AuthContext } from '@/contexts/AuthContext';
import { Search, LogOut } from "lucide-react"
import api from '@/utils/api';
import Cookies from 'js-cookie';


export function Navbar() {
    const auth = useContext(AuthContext);
    const [profile_picture, setProfilePicture] = useState('');


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
                setProfilePicture(response.data.profile_picture);
                console.log(response.data);
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
                                    <AvatarImage src={profile_picture || "https://xsgames.co/randomusers/assets/avatars/male/1.jpg"} />
                                    <AvatarFallback>BP</AvatarFallback>
                                </Avatar>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="min-w-[220px] bg-card rounded-md p-1 shadow-md z-20"
                                    sideOffset={5}
                                    align="end"
                                >
                                    <DropdownMenu.Item className="flex items-center px-2 py-2 text-sm outline-none cursor-default focus:bg-accent focus:text-accent-foreground text-red-500" onClick={logout}>
                                        <LogOut className="mr-2 h-4 w-4 " />
                                        <span>Log out</span>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </div>
                    </DropdownMenu.Root>
                </div>
            </header >
        </div >
    )
}

