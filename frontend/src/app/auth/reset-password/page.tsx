"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { useAuth } from "@/contexts/AuthContext"
import { set } from "zod"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { handleResetPassword } = useAuth()
  
  const ResetPassword = async () => {
    setIsLoading(true)
    setError([])

    if (!token || !email) {
      setError(["Invalid token or email"])
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(["Passwords do not match"])
      setIsLoading(false)
      return
    }
    try {
      const test = await handleResetPassword(token, password, confirmPassword, email)
      if (test.success == false) {
          setError([test.error])
          return
      }
      setIsSubmitted(true)
    } catch (err: any) {
      console.error("Error resetting password:", err)
      setError(err);
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl shadow-zinc-900/20">
          <CardHeader className="space-y-1 border-b border-zinc-800 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-white">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Alert variant="destructive" className="mb-4 bg-red-950 border-red-900 text-red-200">
              <AlertDescription>
                The password reset link is invalid or has expired. Please request a new password reset link.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-300 mt-4"
              onClick={() => router.push("/forgot-password")}
            >
              Request New Link
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl shadow-zinc-900/20">
        <CardHeader className="space-y-1 border-b border-zinc-800 pb-6">
          <CardTitle className="text-2xl font-bold text-center text-white">Set New Password</CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Create a new password for your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {isSubmitted ? (
            <>
              <Alert className="mb-4 bg-green-950 border-green-900 text-green-200">
                <AlertDescription>
                  Your password has been successfully reset. You can now log in with your new password.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-300"
                onClick={() => router.push("/auth/login")}
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-700 placeholder:text-zinc-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-zinc-100"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-zinc-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-zinc-800 bg-zinc-900 text-zinc-100 focus-visible:ring-zinc-700 placeholder:text-zinc-500 pr-10"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        ResetPassword()
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-zinc-400 hover:text-zinc-100"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                  </Button>
                </div>
              </div>

              <Button
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-300"
                onClick={ResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>

              {error && error[0] && (
                <Alert variant="destructive" className="mb-4 bg-red-950 border-red-900 text-red-200">
                  {error.map((err, index) => (
                    <AlertDescription key={index}>{err}</AlertDescription>
                  ))}
                </Alert>
              )}
            </>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-zinc-800 pt-6">
          <p className="text-sm text-zinc-400">
            Remember your password?{" "}
            <Link href="/auth/login" className="text-zinc-300 font-medium hover:text-white transition-colors">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
