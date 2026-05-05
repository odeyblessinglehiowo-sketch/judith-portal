"use client"

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReportIncident() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [activeType, setActiveType] = useState("video")
  const [files, setFiles] = useState<File[]>([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  // ✅ Get logged in user
  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(storedUser))
  }, [])

  // ✅ HANDLE SUBMIT (FIXED)
  const handleSubmit = async () => {
    if (files.length === 0 && activeType !== "text") {
      alert("Please upload something")
      return
    }

    setLoading(true)

    try {
      let fileUrls: string[] = []

      // 🔥 Upload files (only if not text)
      if (activeType !== "text") {
        const formData = new FormData()

        files.forEach((file) => {
          formData.append("files", file)
        })

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        const uploadedFiles = await res.json()
        console.log("UPLOAD RESPONSE:", uploadedFiles)

        // ✅ SAFE CHECK
        if (!Array.isArray(uploadedFiles)) {
          console.error("Upload failed:", uploadedFiles)
          alert("Upload failed")
          setLoading(false)
          return
        }

        fileUrls = uploadedFiles.map((f: any) => f.secure_url)
      }

      // 🔥 Save to Supabase
      const { error } = await supabase.from("reports").insert([
        {
          user_email: user.email,
          type: activeType,
          comment,
          files: fileUrls,
        },
      ])

      if (error) {
        console.error(error)
        alert("Failed to save report")
        setLoading(false)
        return
      }

      alert("Report submitted successfully 🎉")

      // ✅ Reset
      setFiles([])
      setComment("")

    } catch (err) {
      console.error(err)
      alert("Something went wrong")
    }

    setLoading(false)
  }

  // ✅ Loading screen
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

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
            className="w-16 h-16 rounded-full border-4 border-white shadow-lg absolute -top-4 left-5"
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

          <button
            onClick={() => router.push("/upload-results")}
            className="bg-[#E03A3E] text-white py-3 font-semibold rounded-l-lg hover:opacity-90"
          >
            Upload Results
          </button>

          <div className="relative">
            <div className="bg-[#2DBE6C] text-white py-3 font-semibold rounded-r-lg text-center">
              Report Incident
            </div>

            {/* POINTER */}
            <div className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-[#2DBE6C]" />
          </div>
        </div>

        {/* TITLE */}
        <p className="text-center mt-6 text-gray-600">
          Report Incident
        </p>

        {/* TYPE SELECTOR */}
        <div className="mx-6 mt-4 rounded-lg overflow-hidden shadow">

          {["video", "image", "audio", "text"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`
                w-full py-3 text-sm font-medium
                ${
                  activeType === type
                    ? "bg-[#E03A3E] text-white"
                    : "bg-[#dbe7f3] text-gray-700"
                }
              `}
            >
              {type === "text"
                ? "Write Report"
                : `Upload ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          ))}
        </div>

        {/* UPLOAD AREA */}
        <div className="px-6 mt-6">

          {activeType !== "text" ? (
            <div className="bg-[#dbe7f3] p-6 rounded-lg text-center">

              <input
                type="file"
                multiple
                accept={
                  activeType === "video"
                    ? "video/*"
                    : activeType === "image"
                    ? "image/*"
                    : "audio/*"
                }
                onChange={(e) => {
                  const selected = Array.from(e.target.files || [])
                  setFiles(selected)
                }}
                className="w-full"
              />

              <p className="text-sm text-gray-600 mt-2">
                Click or drag file to upload
              </p>
            </div>
          ) : (
            <textarea
              placeholder="Write your report..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 rounded-lg bg-[#dbe7f3] outline-none min-h-[120px]"
            />
          )}

          {/* FILE LIST */}
          {files.length > 0 && (
            <div className="mt-4 text-sm text-gray-700">
              <p className="mb-2 font-medium">Selected files:</p>
              <ul className="space-y-1">
                {files.map((file, i) => (
                  <li key={i}>• {file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {/* COMMENT */}
          {activeType !== "text" && (
            <textarea
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full mt-4 p-4 rounded-lg bg-[#dbe7f3] outline-none"
            />
          )}

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
            {loading ? "Submitting..." : "Submit Report"}
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