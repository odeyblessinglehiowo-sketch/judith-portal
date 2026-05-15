"use client"

import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

declare global {
  interface Window {
    cloudinary: any
  }
}

export default function ReportIncident() {
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [activeType, setActiveType] = useState("video")
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")

    if (!storedUser) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(storedUser))
  }, [router])

  const openUploadWidget = () => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      toast.error("Cloudinary is not configured")
      return
    }

    if (!window.cloudinary) {
      toast.error("Upload widget is still loading")
      return
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        multiple: true,
        resourceType: "auto",
        folder: "reports",
        maxFileSize: 100000000,
        clientAllowedFormats: [
          "jpg",
          "jpeg",
          "png",
          "mp4",
          "mov",
          "mp3",
          "wav",
          "m4a",
        ],
      },
      (error: any, result: any) => {
        if (error) {
          console.error(error)
          toast.error("Upload failed")
          return
        }

        if (result?.event === "success") {
          const url = result.info.secure_url

          setUploadedFiles((prev) =>
            prev.includes(url) ? prev : [...prev, url]
          )

          toast.success("File uploaded")
        }
      }
    )

    widget.open()
  }

  const handleSubmit = async () => {
    if (activeType !== "text" && uploadedFiles.length === 0) {
      toast.error("Upload file first")
      return
    }

    if (!comment.trim()) {
      toast.error("Add a comment")
      return
    }

    if (!user?.email) {
      toast.error("User not found")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from("reports").insert([
        {
          user_email: user.email,
          type: activeType,
          comment: comment.trim(),
          files: activeType === "text" ? [] : uploadedFiles,
          status: "pending",
        },
      ])

      if (error) {
        console.error(error)
        toast.error("Failed to submit")
        return
      }

      toast.success("Report submitted successfully 🎉")
      setUploadedFiles([])
      setComment("")
      setActiveType("video")
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="relative min-h-screen bg-[#f5f7f6] overflow-hidden">
      <div
        className="absolute top-0 left-0 w-full h-[60%] bg-no-repeat bg-center opacity-15 pointer-events-none"
        style={{ backgroundImage: "url('/bg.png')" }}
      />
      <div className="absolute bottom-0 w-full h-[40%] bg-[#f5f7f6] rounded-t-[50px]" />

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        <div className="px-5 pt-6 relative">
          <img
            src={user?.image || "/default-avatar.png"}
            className="w-16 h-16 rounded-full border-4 border-white shadow-lg absolute -top-4 left-5 object-cover"
            alt="Agent"
          />

          <div className="bg-[#0087C8] text-white rounded-xl pt-10 pb-4 px-4 shadow-md">
            <p className="text-sm">Welcome</p>
            <h2 className="font-semibold">{user?.name}</h2>
            <p className="text-sm opacity-90">
              Eket Federal Constituency Primaries
            </p>
          </div>
        </div>

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

        <div className="mx-6 mt-6 rounded-lg overflow-hidden shadow">
          {["video", "image", "audio", "text"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`w-full py-3 text-sm font-medium ${
                activeType === type
                  ? "bg-[#E03A3E] text-white"
                  : "bg-[#dbe7f3] text-gray-700"
              }`}
            >
              {type === "text" ? "Write Report" : `Upload ${type}`}
            </button>
          ))}
        </div>

        <div className="px-6 mt-6">
          {activeType !== "text" && (
            <>
              <button
                onClick={openUploadWidget}
                className="w-full bg-[#0087C8] text-white py-4 rounded-lg font-semibold"
              >
                Upload Files
              </button>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="bg-white p-3 rounded-lg text-sm break-all shadow"
                    >
                      {file}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <textarea
            placeholder={activeType === "text" ? "Write your report..." : "Add incident report..."}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full mt-4 p-4 bg-[#dbe7f3] rounded-lg min-h-[140px] outline-none"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 bg-[#2DBE6C] text-white py-4 rounded-lg font-semibold disabled:opacity-60"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </div>

        <div className="flex justify-center mt-10 pb-6">
          <img src="/logo.png" className="w-28" alt="Judified logo" />
        </div>
      </div>
    </div>
  )
}