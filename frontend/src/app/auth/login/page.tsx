"use client"

import { useContext, useState, useEffect } from "react"
import { AuthContext } from "@/contexts/AuthContext"
import Link from "next/link"
import { Loader2, Github } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Separator } from "@/app/components/ui/separator"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import Image from "next/image"

export default function LoginPage() {
  const auth = useContext(AuthContext)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string[]>([])

  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}`

  const loginUrl = new URL("https://api.intra.42.fr/oauth/authorize")
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_CLIENT_ID is not defined")
  }
  loginUrl.searchParams.set("client_id", clientId)
  loginUrl.searchParams.set("redirect_uri", process.env.NEXT_PUBLIC_BACKEND_URL + "/api/oauth/42")
  loginUrl.searchParams.set("response_type", "code")

  const handleLogin = async () => {
    let response;
    try {
      setIsLoading(true)
      setError(([]))

      if (!auth) throw new Error("Auth context not found")

      response = await auth.login(email, password)
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

  const handleSocialLogin = (url: string) => {
    window.location.href = url
  }

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token")
    if (token) {
      try {
        const parsedToken = JSON.parse(token)
        if (token && auth) {
          auth.setToken(parsedToken.token)
          window.location.href = "/dashboard"
        }
      } catch (error) {
        setError(["Failed to process authentication token."])
      }
    }
  }, [auth])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl shadow-zinc-900/20">
        <CardHeader className="space-y-1 border-b border-zinc-800 pb-6">
          <CardTitle className="text-2xl font-bold text-center text-white">Login</CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-zinc-300">
                Password
              </Label>
              <Link href="/forgot-password" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                Forgot password?
              </Link>
            </div>
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
                  handleLogin()
                }
              }}
            />
          </div>

          <Button
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-300"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
          {error && error[0] && (
              <Alert variant="destructive" className="mb-4 bg-red-950 border-red-900 text-red-200">
                {error.map((err, index) => (
                <AlertDescription key={index}>{err}</AlertDescription>
                ))}
              </Alert>
          )}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => handleSocialLogin(loginUrl.toString())}
              disabled={isLoading}
              className="w-full bg-[#00BABC] hover:bg-[#00A3A5] text-white"
            >
              <span className="flex items-center justify-center">42</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => handleSocialLogin(githubUrl)}
              disabled={isLoading}
              className="w-full border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-50"
            >
              <Github className="mr-2 h-4 w-4" />
              <span>GitHub</span>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-400">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-zinc-300 font-medium hover:text-white transition-colors">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

