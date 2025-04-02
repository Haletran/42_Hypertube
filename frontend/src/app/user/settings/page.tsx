"use client"

import { useState, useContext } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card, CardContent } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Camera, User, KeyRound, Loader2 } from "lucide-react"
import { AuthContext } from "@/contexts/AuthContext"

export default function SettingsPage() {
  const auth = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState("profile")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("/placeholder.svg?height=200&width=200")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setAvatarUrl(url)
    }
  }

  const handleSaveChanges = async () => {
    try {
        setIsLoading(true)
        //if (!old_password) throw new Error("Old password is required")
        if (!auth) throw new Error("Auth context not found")
        
        await auth.update(username, email, newPassword, currentPassword)
        await new Promise((resolve) => setTimeout(resolve, 500))
        setIsLoading(false)
    } catch (error: any) {
        setError(error.message || 'An error occurred')
        setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto p-6">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-zinc-400">Manage your account settings and preferences.</p>
        </div>

        <Separator className="my-6 bg-zinc-800" />

        <div className="flex flex-col space-y-8">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 w-fit">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Password
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-xl font-semibold">Profile Picture</h2>
                      <p className="text-zinc-400 text-sm">
                        Update your profile picture. This will be displayed on your profile.
                      </p>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="relative group">
                        <Avatar className="h-24 w-24 border-2 border-zinc-800">
                          <AvatarImage src={avatarUrl} alt="Profile picture" />
                          <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xl">
                            {username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <label
                            htmlFor="avatar-upload"
                            className="cursor-pointer p-2 rounded-full hover:bg-zinc-800/50"
                          >
                            <Camera className="h-5 w-5" />
                            <span className="sr-only">Upload new picture</span>
                          </label>
                          <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                          />
                        </div>
                      </div>

                      <div>
                        <Button
                          variant="outline"
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                          onClick={() => document.getElementById("avatar-upload").click()}
                        >
                          Change Picture
                        </Button>
                        <p className="text-zinc-500 text-xs mt-2">JPG, GIF or PNG. Max size of 2MB.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-xl font-semibold">Profile Information</h2>
                      <p className="text-zinc-400 text-sm">Update your account information.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-zinc-300">
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700"
                        />
                        <p className="text-zinc-500 text-xs">This is your public display name.</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700"
                        />
                        <p className="text-zinc-500 text-xs">We'll send important notifications to this email.</p>
                      </div>

                      <div>
                        <Button
                          onClick={handleSaveChanges}
                          disabled={isLoading}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Save Changes"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password" className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-xl font-semibold">Change Password</h2>
                      <p className="text-zinc-400 text-sm">Update your password to keep your account secure.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-zinc-300">
                          Current Password
                        </Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-zinc-300">
                          New Password
                        </Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-zinc-300">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700"
                        />
                      </div>

                      <div>
                        <Button
                          onClick={handleSaveChanges}
                          disabled={isLoading}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating Password...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

