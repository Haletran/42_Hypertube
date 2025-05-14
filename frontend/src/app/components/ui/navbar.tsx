"use client";
import Link from "next/link"
import { use, useContext, useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { AuthContext, useAuth } from '@/contexts/AuthContext';
import { Search, LogOut, Settings, User, Globe } from "lucide-react"
import api from '@/utils/api';
import Cookies from 'js-cookie';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { DownloadsDropdown } from "@/app/components/DownloadsMenu"


export function Navbar() {
    const auth = useContext(AuthContext);
    const { user } = useAuth();
    const [language, setLanguage] = useState<string>(user?.user?.language || Cookies.get('language') || 'en');

    const logout = async () => {
        try {
            if (!auth) throw new Error('Auth context not found');
            await auth.logout();
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
    const handleLanguageChange = async (value: string) => {
        if (!auth) throw new Error('Auth context not found');
        if (value === language) return;
        try  {
            const token = Cookies.get('token');
            const response = await api.patch(`/api/users/${user?.user?.id}/language`, { language: value }, { headers: { Authorization: `Bearer ${token}` } });
            if (response.status === 200) {
                setLanguage(value);
                Cookies.set('language', value, { expires: 7, path: '/' });
                const url = new URL(window.location.href);
                if (url.searchParams.has('language')) {
                    url.searchParams.set('language', value);
                    window.history.replaceState({}, '', url.toString());
                }
                window.location.reload();
            }
        } catch (error) {
            console.error('Language change failed:', error);
        }
    }
    
    return (
        <div className="container mx-auto p-4">
            <header className="top-0 z-50 w-full  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/dashboard" className="flex items-center">
                        <h1 className="text-xl font-bold tracking-tight">Hypertube</h1>
                    </Link>
                    <DropdownMenu.Root>
                        <div className="flex items-center gap-4">
                            <Link prefetch={false} href="/search" className="text-muted-foreground">
                                <Search className="text-muted-foreground size-4" />
                            </Link>
                            <DownloadsDropdown />
                            <div className="relative">
                                <Select value={language} onValueChange={handleLanguageChange}>
                                  <SelectTrigger className="w-[110px] h-9 bg-zinc-900 border-none hover:bg-zinc-800 focus:ring-0">
                                    <div className="flex items-center gap-2">
                                      <Globe className="h-4 w-4 text-muted-foreground" />
                                      <SelectValue placeholder="Language" />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent  className="bg-zinc-900 border border-zinc-800 rounded-md animate-in fade-in-80">
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="fr">Français</SelectItem>
                                  </SelectContent>
                                </Select>
                            </div>
                            <DropdownMenu.Trigger asChild>
                            <Avatar>
                                <AvatarImage className="object-cover" src={user?.user?.profilePicture} />
                                <AvatarFallback>{user?.user?.username ? user?.user?.username.charAt(0).toUpperCase() : ''}</AvatarFallback>
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
                                        <div className="font-medium text-sm">{user?.user?.username}</div>
                                    </div>
                                    <div className="py-1">
                                        <DropdownMenu.Item asChild>
                                            <Link prefetch={true}
                                                href="/user/profile"
                                                className="flex items-center px-3 py-2 text-sm rounded-sm hover:bg-zinc-800 focus:bg-zinc-800 outline-none cursor-pointer"
                                            >
                                                <User className="mr-2 h-4 w-4 text-zinc-400" />
                                                <span>Profile</span>
                                            </Link>
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item asChild>
                                            <Link prefetch={true}
                                                href="/user/settings"
                                                className="flex items-center px-3 py-2 text-sm rounded-sm hover:bg-zinc-800 focus:bg-zinc-800 outline-none cursor-pointer"
                                            >
                                                <Settings className="mr-2 h-4 w-4 text-zinc-400" />
                                                <span>{language === "en" ? "Settings" : "Paramètres"}</span>
                                            </Link>
                                        </DropdownMenu.Item>
                                    </div>
                                    <div className="pt-1 mt-1 border-t border-zinc-800">
                                        <DropdownMenu.Item
                                            className="flex items-center px-3 py-2 text-sm rounded-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 focus:bg-red-950/50 focus:text-red-300 outline-none cursor-pointer"
                                            onClick={logout}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                                <span>{language === "en" ? "Logout" : "Se déconnecter"}</span>
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

