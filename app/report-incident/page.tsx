"use client"

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

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

  // ✅ CLOUDINARY UPLOAD FUNCTION (FIXED)
  const uploadToCloudinary = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", "judith_upload")

  const isVideo = file.type.startsWith("video")

  const url = isVideo
    ? "https://api.cloudinary.com/v1_1/dz85nxxmg/video/upload"
    : "https://api.cloudinary.com/v1_1/dz85nxxmg/upload"

  const res = await fetch(url, {
    method: "POST",
    body: formData,
  })

  const data = await res.json()

  if (!data.secure_url) {
    console.error("Cloudinary error:", data)
    throw new Error("Upload failed")
  }
if (file.size > 20 * 1024 * 1024) {
  toast.error("Video must be less than 20MB")
  return
}
  return data.secure_url
}

  // ✅ HANDLE SUBMIT (FIXED PROPERLY)
  const handleSubmit = async () => {
    if (files.length === 0 && activeType !== "text") {
      alert("Please upload something")
      return
    }

    setLoading(true)

    try {
      let fileUrls: string[] = []

      // 🔥 Upload all files
      if (activeType !== "text") {
        fileUrls = await Promise.all(
          files.map((file) => uploadToCloudinary(file))
        )
      }

      // 🔥 Save to Supabase
      const { error } = await supabase.from("reports").insert([
        {
          user_email: user.email,
          type: activeType,
          comment,
          files: fileUrls,
          status: "pending",
        },
      ])

      if (error) {
        console.error(error)
        alert("Failed to save report")
        return
      }

      alert("Report submitted successfully 🎉")

      // reset
      setFiles([])
      setComment("")

    } catch (err) {
      console.error(err)
      toast.error("Upload failed")
    }

    setLoading(false)
  }

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-[#f5f7f6] overflow-hidden">

      {/* BACKGROUND */}
      <div
        className="absolute top-0 left-0 w-full h-[60%] bg-no-repeat bg-center opacity-15"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

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
            className="bg-[#E03A3E] text-white py-3 font-semibold rounded-l-lg"
          >
            Upload Results
          </button>

          <div className="relative">
            <div className="bg-[#2DBE6C] text-white py-3 font-semibold text-center rounded-r-lg">
              Report Incident
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-transparent border-t-[#2DBE6C]" />
          </div>
        </div>

        {/* TYPE SELECTOR */}
        <div className="mx-6 mt-6 rounded-lg overflow-hidden shadow">
          {["video", "image", "audio", "text"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`w-full py-3 ${
                activeType === type
                  ? "bg-[#E03A3E] text-white"
                  : "bg-[#dbe7f3]"
              }`}
            >
              {type === "text"
                ? "Write Report"
                : `Upload ${type}`}
            </button>
          ))}
        </div>

        {/* UPLOAD */}
        <div className="px-6 mt-6">
          {activeType !== "text" ? (
            <input
              type="file"
              multiple
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []))
              }
              className="w-full bg-[#dbe7f3] p-4 rounded-lg"
            />
          ) : (
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-4 bg-[#dbe7f3] rounded-lg"
            />
          )}

          {files.length > 0 && (
            <div className="mt-4">
              {files.map((f, i) => (
                <p key={i}>{f.name}</p>
              ))}
            </div>
          )}

          <textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full mt-4 p-4 bg-[#dbe7f3] rounded-lg"
          />

          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-[#0087C8] text-white py-3 rounded-lg"
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