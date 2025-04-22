"use client"
import { useState, useContext } from "react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Card, CardContent } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { Camera, User, KeyRound, Loader2, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { AuthContext } from "@/contexts/AuthContext"
import { useAuth } from "@/contexts/AuthContext"

export default function SettingsPage() {
  const auth = useContext(AuthContext)
  const [activeTab, setActiveTab] = useState("profile")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user, newEmail, newUsername, setEmail, setUsername, error, setError } = useAuth();
  const {username = '', email = '', profilePicture = '', language, authMethod} = user?.user || {}

  const handleAvatarSelect = (index: number) => {
    setSelectedAvatar(index)
  }
  
  const avatarOptions = [...new Set([
    profilePicture,
    "/pictures/netflix_default.jpg",
    "https://loremfaces.net/96/id/1.jpg",
    "https://loremfaces.net/96/id/2.jpg",
    "https://loremfaces.net/96/id/3.jpg",
    "https://loremfaces.net/96/id/4.jpg",
  ])].filter((url: string) => url)



  const handleActiveTabChange = (value: string) => {
    setError(null)
    setActiveTab(value)
  }
  const handleSaveChanges = async () => {
    try {
        setIsLoading(true)
        if (!auth) throw new Error("Auth context not found")
        const response = await auth.update(newUsername, newEmail, newPassword, currentPassword, avatarOptions[selectedAvatar])
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (!response.success) {
          throw new Error(response.error);
        }
        setIsLoading(false)
        window.location.reload()
    } catch (error: any) {
        setError(error.message || 'An error occurred')
        setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
        setIsLoading(true)
        if (!currentPassword || !newPassword || !confirmPassword) {
            throw new Error('Please fill in all fields')
        }
        if (newPassword !== confirmPassword) {
            throw new Error('Passwords do not match')
        }
        if (!auth) throw new Error("Auth context not found")
        const response = await auth.update(newUsername, newEmail, newPassword, currentPassword, avatarOptions[selectedAvatar]);
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (!response.success) {
            throw new Error(response.error);
        }
        setIsLoading(false)
        window.location.reload()
    } catch (error: any) {
        setError(error.message || 'An error occurred')
        setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto p-6">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold">
            {language === "en" ? "Settings" : "Paramètres"}
          </h1>
          <p className="text-zinc-400">
            {language === "en" ? "Manage your account settings" : "Gérez les paramètres de votre compte"}
          </p>
        </div>

        <Separator className="my-6 bg-zinc-800" />

        <div className="flex flex-col space-y-8">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={handleActiveTabChange} className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 p-1 w-fit">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                <User className="h-4 w-4 mr-2" />
                Profile 
              </TabsTrigger>
              {authMethod === "local" && (

              <TabsTrigger
                value="password"
                className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                {language === "en" ? "Password" : "Mot de passe"}
              </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-6">
              <TabsContent value="profile" className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-xl font-semibold">
                        {language === "en" ? "Profile Picture" : "Photo de profil"}
                      </h2>
                      <p className="text-zinc-400 text-sm">
                        {language === "en" ? "Update your profile picture. This will be displayed on your profile." : "Changer votre photo de profil ici"}
                      </p>
                    </div>

                    <div className="flex items-center space-x-6">
                      <Avatar className="h-24 w-24 border-2 border-zinc-800">
                        <AvatarImage src={avatarOptions[selectedAvatar]} alt="Profile picture" className="object-cover"/>
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xl">
                          {username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                              {language === "en" ? "Change Picture" : "Changer la photo"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>
                                {language === "en" ? "Choose Your Avatar" : "Choisissez votre avatar"}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-5 gap-4 py-4">
                              {avatarOptions.map((avatar, index) => (
                                <div
                                  key={index}
                                  className={`
                                    relative cursor-pointer rounded-md overflow-hidden
                                    ${selectedAvatar === index ? "ring-2 ring-zinc-400" : "hover:ring-1 hover:ring-zinc-600"}
                                  `}
                                  onClick={() => handleAvatarSelect(index)}
                                >
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={avatar} alt={`Avatar option ${index + 1}`} />
                                  </Avatar>
                                  {selectedAvatar === index && (
                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                      <Check className="h-6 w-6 text-white" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-3">
                              <Button
                                variant="outline"
                                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                onClick={() => setDialogOpen(false)}
                              >
                                {language === "en" ? "Cancel" : "Annuler"}
                              </Button>
                              <Button className="bg-zinc-800 hover:bg-zinc-700" onClick={() => setDialogOpen(false)}>
                                {language === "en" ? "Save" : "Enregistrer"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <p className="text-zinc-500 text-xs mt-2">
                          {language === "en" ? "Choose from our collection of avatars." : "Choisissez parmi notre collection d'avatars."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-xl font-semibold">
                        {language === "en" ? "Account Settings" : "Paramètres du compte"}
                      </h2>
                      <p className="text-zinc-400 text-sm">
                        {language === "en" ? "Update your username and email address." : "Mettez à jour votre nom d'utilisateur et votre adresse e-mail."}
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-zinc-300">
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={newUsername}
                          placeholder={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={authMethod !== "local"}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmail}
                          placeholder={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-zinc-700"
                        />
                      </div>

                      <div>
                      {error ? (
                          <Alert variant="destructive" className="mb-4 bg-red-950 border-red-900 text-red-200">
                            <AlertDescription >{error}</AlertDescription>
                          </Alert>
                        ): null}
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
                            <>
                              {language === "en" ? "Save Changes" : "Enregistrer les modifications"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {authMethod === "local" && (
              <TabsContent value="password" className="space-y-6">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-6">
                    <div className="space-y-2 mb-6">
                      <h2 className="text-xl font-semibold">
                        {language === "en" ? "Change Password" : "Changer le mot de passe"}
                      </h2>
                      <p className="text-zinc-400 text-sm">
                        {language === "en" ? "Update your password for better security." : "Mettez à jour votre mot de passe pour une meilleure sécurité."}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-zinc-300">
                          {language === "en" ? "Current Password" : "Mot de passe actuel"}
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
                          {language === "en" ? "New Password" : "Nouveau mot de passe"}
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
                          {language === "en" ? "Confirm New Password" : "Confirmer le nouveau mot de passe"}
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
                        <div>
                        {error ? (
                            <Alert variant="destructive" className="mb-4 bg-red-950 border-red-900 text-red-200">
                              <AlertDescription >{error}</AlertDescription>
                            </Alert>
                          ) : null}
                          <Button
                            onClick={handlePasswordChange}
                            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
                            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {language === "en" ? "Updating..." : "Mise à jour..."}
                              </>
                            ) : (
                              <>
                                {language === "en" ? "Update Password" : "Mettre à jour le mot de passe"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

