"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AdminLogin() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

 const handleLogin = async () => {
  setLoading(true)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  setLoading(false)

  console.log("LOGIN RESPONSE:", { data, error })

  if (error) {
    alert(error.message) // 👈 show real error
    return
  }

  router.push("/admin")
}
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#f5f7f6] overflow-hidden">

      {/* BACKGROUND */}
      <div
        className="absolute top-0 left-0 w-full h-[60%] bg-no-repeat bg-center opacity-10 bg-cover"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-sm px-6">

        <div className="bg-white p-6 rounded-2xl shadow-xl">

          <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
            Admin Login
          </h2>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="text-sm text-gray-600 mb-1 block">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full p-3 rounded-lg border border-gray-300 
                bg-white text-gray-800
                focus:outline-none focus:ring-2 focus:ring-[#2DBE6C]
              "
            />
          </div>

          {/* PASSWORD */}
          <div className="mb-6">
            <label className="text-sm text-gray-600 mb-1 block">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full p-3 rounded-lg border border-gray-300 
                bg-white text-gray-800
                focus:outline-none focus:ring-2 focus:ring-[#2DBE6C]
              "
            />
          </div>

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="
              w-full bg-[#2DBE6C] text-white py-3 rounded-lg font-semibold
              transition-all duration-200
              hover:scale-[1.02] active:scale-[0.97]
              disabled:opacity-50
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </div>

      </div>
    </div>
  )
}