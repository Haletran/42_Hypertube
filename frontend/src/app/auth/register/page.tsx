"use client"

import { useContext, useState } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { BackButton } from "@/app/components/ui/backButton";

export default function RegisterPage() {
  const auth = useContext(AuthContext)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string[]>([])

  const handleRegister = async () => {
    let response;
    try {
      setIsLoading(true)
      setError([])

      if (!auth) throw new Error("Auth context not found")
      response = await auth.register(username, email, password)
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (!response.success)
        throw response.error;
      await new Promise((resolve) => setTimeout(resolve, 500))
      window.location.href = "/dashboard"
    } catch (error: any) {
      if (Array.isArray(error)) {
        setError(error.map((err: any) => err.message || err.toString()));
      } else if (error.errors) {
        setError(error.errors.map((err: any) => err.message || err.toString()));
      } else {
        setError([error.message || error.toString()]);
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl shadow-zinc-900/20">
        <CardHeader className="space-y-1 border-b border-zinc-800 pb-6">
          <BackButton backUrl="/auth/login" />
          <CardTitle className="text-2xl font-bold text-center text-white">Create an Account</CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Enter your information to create your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-zinc-300">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-700 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-700 placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-700 placeholder:text-zinc-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRegister()
                }
              }}
            />
          </div>
          {error && error[0] && (
              <Alert variant="destructive" className="mb-4 bg-red-950 border-red-900 text-red-200">
                {error.map((err, index) => (
                <AlertDescription key={index}>{err}</AlertDescription>
                ))}
              </Alert>
          )}
          <div className="pt-2">
            <Button
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-300"
              onClick={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-zinc-300 font-medium hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

