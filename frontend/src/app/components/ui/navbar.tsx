"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { DownloadBar } from "../DownloadBar"
import { Search } from "lucide-react"

export function Navbar() {
    return (
        <div className="container mx-auto p-4">
            <header className="sticky top-0 z-50 w-full  bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    <Link href="/" className="flex items-center" onClick={(e) => {
                        e.preventDefault();
                        window.location.href = '/';
                    }}>
                        <h1 className="text-xl font-bold tracking-tight">Hypertube</h1>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/search" className="text-muted-foreground">
                            <Search className="text-muted-foreground size-4" />
                        </Link>
                        <Avatar>
                            <AvatarImage src="https://xsgames.co/randomusers/assets/avatars/male/1.jpg" />
                            <AvatarFallback>BP</AvatarFallback>
                        </Avatar>
                    </div>
                </div>

            </header >
        </div >
    )
}

