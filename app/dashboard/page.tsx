"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(storedUser))
  }, [])

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-[#f5f7f6] overflow-hidden">

      {/* 🔵 BACKGROUND IMAGE (60%) */}
      <div
  className="
    absolute top-0 left-0 w-full h-[60%]
    bg-no-repeat
    bg-[length:120%]
    bg-center
    opacity-15

    md:bg-[length:900px]
    md:bg-[fit_top_120px]
  "
  style={{ backgroundImage: "url('/bg.png')" }}
/>

      {/* ⚪ WHITE CURVE (40%) */}
      <div className="absolute bottom-0 w-full h-[40%] bg-[#f5f7f6] rounded-t-[50px]" />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-5xl mx-auto w-full">

        {/* TOP SECTION */}
        <div className="px-5 pt-6">

          {/* PROFILE + BLUE BLOCK */}
          <div className="relative">

            {/* PROFILE IMAGE (FLOATING) */}
            <img
              src={user.image || "/default-avatar.png"}
              className="
                w-16 h-16 rounded-full object-cover shadow-lg
                border-4 border-white
                absolute -top-8 left-4
              "
            />

            {/* BLUE CARD */}
            <div className="bg-[#0087C8] text-white rounded-xl pt-10 pb-4 px-4 shadow-md">

              <p className="text-sm opacity-90">Welcome</p>

              <h2 className="text-lg font-semibold leading-tight">
                {user.name || "Agent"}
              </h2>

              <p className="text-sm opacity-90 mt-1">
                Eket Federal Constituency Primaries
              </p>

            </div>

          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-4 mt-8 md:max-w-xl md:mx-auto">

            <button
              onClick={() => router.push("/upload-results")}
              className="
                bg-[#E03A3E] text-white py-4 rounded-xl font-semibold shadow-md
                transition-all duration-200
                hover:scale-[1.04] hover:shadow-lg active:scale-[0.97]
              "
            >
              Upload Results
            </button>

            <button
              onClick={() => router.push("/report-incident")}
              className="
                bg-[#2DBE6C] text-white py-4 rounded-xl font-semibold shadow-md
                transition-all duration-200
                hover:scale-[1.04] hover:shadow-lg active:scale-[0.97]
              "
            >
              Report Incident
            </button>

          </div>
        </div>

        {/* FOOTER (JUDIFIED) */}
        <div className="mt-auto flex justify-center pb-6">
          <img src="/logo.png" className="w-28 opacity-100" />
        </div>

      </div>
    </div>
  )
}