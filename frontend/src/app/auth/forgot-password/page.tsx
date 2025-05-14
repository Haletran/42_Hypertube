"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Label } from "@/app/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Alert, AlertDescription } from "@/app/components/ui/alert"
import { BackButton } from "@/app/components/ui/backButton"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string[]>([])
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleResetPassword = async () => {
    try {
      setIsLoading(true)
      setError([])
  
      if (!email || !email.includes("@")) {
        throw new Error("Please enter a valid email address")
      }
  
      const response = await fetch('http://localhost:3333/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to send reset email')
      }
  
      setIsSubmitted(true)
    } catch (error: any) {
      console.error("Reset password error:", error)
      if (Array.isArray(error)) {
        setError(error.map((err: any) => err.message || err.toString()))
      } else if (error.errors) {
        setError(error.errors.map((err: any) => err.message || err.toString()))
      } else {
        setError([error.message || error.toString()])
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
          <CardTitle className="text-2xl font-bold text-center text-white">Reset Password</CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {isSubmitted ? (
            <Alert className="mb-4 bg-green-950 border-green-900 text-green-200">
              <AlertDescription>
                If an account exists with this email, you will receive a password reset link shortly. Please check your
                inbox and spam folder.
              </AlertDescription>
            </Alert>
          ) : (
            <>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleResetPassword()
                    }
                  }}
                />
              </div>

              <Button
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 focus:ring-zinc-300"
                onClick={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
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
