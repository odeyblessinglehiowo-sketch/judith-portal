"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { users } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (!email || !password) {
      alert("Enter email and password")
      return
    }

    setLoading(true)

    const user = users.find(
      (u) => u.email === email && u.password === password
    )

    if (!user) {
      alert("Invalid login credentials")
      setLoading(false)
      return
    }

    // save user to localStorage
    localStorage.setItem("user", JSON.stringify(user))

    setLoading(false)
    router.push("/dashboard")
  }

  return (
    <div className="relative min-h-screen bg-white overflow-hidden flex items-center justify-center">

      {/* BACKGROUND */}
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

      {/* WHITE CURVE */}
      <div className="absolute top-[45%] left-0 w-full h-[60%] bg-white rounded-t-[60px]" />

      {/* CONTENT */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center px-6 py-10">

        {/* LOGO */}
        <img src="/logo.png" className="w-20 mb-6" />

        {/* CARD */}
        <div className="bg-white rounded-3xl px-6 py-6 mb-8 shadow-lg w-full text-center">
          <img src="/judith2027.png" className="w-40 mx-auto mb-4" />

          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Ward Agent Login
          </h2>

          {/* EMAIL */}
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

          {/* PASSWORD */}
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

          {/* BUTTON */}
          <button
            onClick={handleLogin}
            className="
              w-full bg-[#2DBE6C] text-white py-3 rounded-lg font-semibold
              hover:scale-[1.02] active:scale-[0.97] transition
            "
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>

      </div>
    </div>
  )
}