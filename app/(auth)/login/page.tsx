"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"

const REMEMBER_KEY = "pms_remembered_email"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  // Load saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setValue("email", saved)
      setRememberMe(true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, data.email)
    } else {
      localStorage.removeItem(REMEMBER_KEY)
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success("Welcome back!")
    router.push("/dashboard")
    router.refresh()
  }

  const handleForgotPassword = async () => {
    const email = getValues("email")
    if (!email) { toast.error("Enter your email first"); return }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    })
    if (error) toast.error(error.message)
    else toast.success("Password reset email sent — check your inbox")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md"
    >
      {/* Glass card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(15, 18, 35, 0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        {/* Indigo-to-violet accent bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />

        {/* Header */}
        <div className="px-8 pt-10 pb-7">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex items-center gap-3 mb-9"
          >
            <div
              className="p-2.5 rounded-xl"
              style={{
                background: "rgba(99,102,241,0.15)",
                boxShadow: "0 0 0 1px rgba(99,102,241,0.25), 0 0 12px rgba(99,102,241,0.15)",
              }}
            >
              <Building2 className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-sm font-semibold tracking-widest text-slate-400 uppercase">
              Abhay&apos;s PMS
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to manage your rental portfolio
            </p>
          </motion.div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="px-8 space-y-5"
          >
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-4 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-11 pr-10 bg-white/[0.05] border-white/[0.10] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="h-4 w-4" />
                    : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="px-8 pt-6 pb-10 flex flex-col gap-4"
          >
            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(!!v)}
                className="border-white/20 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-slate-400 cursor-pointer select-none"
              >
                Remember my email
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold text-white transition-all"
              style={{
                background: loading
                  ? "rgba(99,102,241,0.5)"
                  : "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                boxShadow: loading ? "none" : "0 4px 24px rgba(99,102,241,0.35)",
              }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Sign in
            </Button>

            <p className="text-sm text-slate-500 text-center">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline underline-offset-4 transition-colors"
              >
                Create one
              </Link>
            </p>
          </motion.div>
        </form>
      </div>

      {/* Subtle glow under the card */}
      <div
        className="absolute -z-10 w-64 h-16 left-1/2 -translate-x-1/2 bottom-0 translate-y-4 blur-2xl pointer-events-none"
        style={{ background: "rgba(99,102,241,0.20)" }}
      />
    </motion.div>
  )
}
