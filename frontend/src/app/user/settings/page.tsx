"use client";
import { useContext, useState, useEffect } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import Link from "next/link"



export default function SettingsPage() {
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    
    const changeData = async () => {
        try {
            setIsLoading(true)
            await new Promise((resolve) => setTimeout(resolve, 500))
            setIsLoading(false)
        } catch (error: any) {
            console.error(error)
            setIsLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="w-full max-w-md p-4">
                <p className="text-2xl font-bold text-center">Change password</p>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-zinc-300">
                            Password
                        </Label>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-700 placeholder:text-zinc-500"
                    />
                </div>
                <Button
                    onClick={() => {changeData()}}
                    disabled={isLoading}
                    className="w-full mt-4 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>


            </div>
        </div>
    )

}