"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function UploadResults() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [results, setResults] = useState({
    judith: "",
    eunice: "",
    okpolupm: "",
  })

  // ✅ AUTH CHECK
  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(storedUser))
  }, [])

  // ✅ SUBMIT (NOW CONNECTED TO SUPABASE)
  const handleSubmit = async () => {
    // Validation
    if (!results.judith || !results.eunice || !results.okpolupm) {
      alert("Please fill all fields")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("reports").insert([
        {
          user_email: user.email,
          judith: Number(results.judith),
          eunice: Number(results.eunice),
          okpolupm: Number(results.okpolupm),
        },
      ])

      if (error) {
        console.error(error)
        alert("Failed to submit results")
        setLoading(false)
        return
      }

      alert("Results submitted successfully 🎉")

      // Reset form
      setResults({
        judith: "",
        eunice: "",
        okpolupm: "",
      })

      router.push("/dashboard")

    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    }

    setLoading(false)
  }

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-[#f5f7f6] overflow-hidden">

      {/* BACKGROUND (60%) */}
      <div
        className="
          absolute top-0 left-0 w-full h-[60%]
          bg-no-repeat bg-center opacity-15
          bg-[length:120%]
          md:bg-[length:900px] md:bg-[position:center_top_120px]
        "
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      {/* WHITE CURVE */}
      <div className="absolute bottom-0 w-full h-[40%] bg-[#f5f7f6] rounded-t-[50px]" />

      <div className="relative z-10 max-w-5xl mx-auto w-full">

        {/* HEADER */}
        <div className="px-5 pt-6 relative">

          <img
            src={user?.image || "/default-avatar.png"}
            className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg absolute -top-4 left-5"
          />

          <div className="bg-[#0087C8] text-white rounded-xl pt-10 pb-4 px-4 shadow-md">
            <p className="text-sm">Welcome</p>
            <h2 className="font-semibold">{user?.name}</h2>
            <p className="text-sm opacity-90">
              Eket Federal Constituency Primaries
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-2 mt-6 px-5">

          {/* ACTIVE */}
          <div className="relative">
            <div className="bg-[#E03A3E] text-white py-3 text-center font-semibold rounded-l-lg">
              Upload Results
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#E03A3E]" />
          </div>

          {/* INACTIVE */}
          <button
            onClick={() => router.push("/report-incident")}
            className="bg-[#2DBE6C] text-white py-3 text-center font-semibold rounded-r-lg hover:opacity-90"
          >
            Report Incident
          </button>
        </div>

        {/* FORM */}
        <div className="px-6 mt-10 space-y-6">

          <p className="text-center text-gray-600">
            Upload Results Below
          </p>

          {/* ROWS */}
          {[
            { key: "judith", label: "Judith Mayen Ogbara" },
            { key: "eunice", label: "Eunice Thomas" },
            { key: "okpolupm", label: "Okpolupm Etteh" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-4">
              <span className="w-40 text-sm font-medium">
                {item.label}
              </span>

              <input
                type="number"
                value={(results as any)[item.key]}
                onChange={(e) =>
                  setResults({
                    ...results,
                    [item.key]: e.target.value,
                  })
                }
                className="flex-1 p-3 rounded-md bg-[#dbe7f3] outline-none"
              />
            </div>
          ))}

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="
              w-full mt-6 bg-[#0087C8] text-white py-3 rounded-lg font-semibold
              hover:scale-[1.02] active:scale-[0.97] transition
              disabled:opacity-50
            "
          >
            {loading ? "Submitting..." : "Submit Results"}
          </button>
        </div>

        {/* FOOTER */}
        <div className="flex justify-center mt-10 pb-6">
          <img src="/logo.png" className="w-28" />
        </div>

      </div>
    </div>
  )
}