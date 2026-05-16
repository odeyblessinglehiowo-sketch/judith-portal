"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Enter email and password")
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      })

      if (error) {
        toast.error("Invalid login credentials")
        setLoading(false)
        return
      }

      if (!data.user) {
        toast.error("Login failed")
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        toast.error("Profile not found")
        setLoading(false)
        return
      }

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.user.id,
          email: data.user.email,
          ...profile,
        })
      )

      toast.success("Login successful")
      router.push("/dashboard")
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong")
    }

    setLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden flex items-center justify-center">
      <div
        className="
          absolute top-0 left-0 w-full 
          h-[55%] 
          bg-no-repeat 
          bg-center 
          bg-cover 
          opacity-20
          md:h-[45%]
          md:bg-contain
          md:bg-[center_top_40px]
        "
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      <div className="absolute top-[45%] left-0 w-full h-[60%] bg-white rounded-t-[60px]" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center px-6 py-10">
        <img src="/logo.png" className="w-20 mb-6" alt="Logo" />

        <div className="bg-white rounded-3xl px-6 py-6 mb-8 shadow-lg w-full text-center">
          <img src="/judith2027.png" className="w-40 mx-auto mb-4" alt="Judith 2027" />

          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Ward Agent Login
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full mb-3 p-3 rounded-lg
              border border-gray-300
              bg-white text-black
              outline-none
              focus:ring-2 focus:ring-[#2DBE6C]
            "
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="
              w-full mb-4 p-3 rounded-lg
              border border-gray-300
              bg-white text-black
              outline-none
              focus:ring-2 focus:ring-[#2DBE6C]
            "
          />

          <button
            onClick={handleLogin}
            disabled={loading}
            className="
              w-full bg-[#2DBE6C] text-white py-3 rounded-lg font-semibold
              hover:scale-[1.02] active:scale-[0.97] transition
              disabled:opacity-60
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  )
}