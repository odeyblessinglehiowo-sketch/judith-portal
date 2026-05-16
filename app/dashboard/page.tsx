"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

declare global {
  interface Window {
    cloudinary: any
  }
}

type Profile = {
  id: string
  email: string
  name: string
  constituency: string
  lga: string
  image: string | null
  role: string
}

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadProfile = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        router.push("/login")
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (error || !data) {
        toast.error("Profile not found")
        router.push("/login")
        return
      }

      setProfile(data as Profile)
    }

    loadProfile()
  }, [router])

  const openPhotoWidget = () => {
    if (!window.cloudinary) {
      toast.error("Upload widget is still loading")
      return
    }

    if (!profile) return

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        multiple: false,
        resourceType: "image",
        folder: "profiles",
        maxFileSize: 10000000,
      },
      async (error: any, result: any) => {
        if (error) {
          toast.error("Photo upload failed")
          return
        }

        if (result?.event === "success") {
          const imageUrl = result.info.secure_url

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ image: imageUrl })
            .eq("id", profile.id)

          if (updateError) {
            toast.error("Could not save photo")
            return
          }

          setProfile({ ...profile, image: imageUrl })
          toast.success("Photo updated")
        }
      }
    )

    widget.open()
  }

  if (!profile) return null

  return (
    <div className="relative min-h-screen bg-[#f5f7f6] overflow-hidden">
      <div
        className="
          absolute top-0 left-0 w-full h-[60%]
          bg-no-repeat bg-[length:120%] bg-center opacity-15
          md:bg-[length:900px] md:bg-[fit_top_120px]
        "
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      <div className="absolute bottom-0 w-full h-[40%] bg-[#f5f7f6] rounded-t-[50px]" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-5xl mx-auto w-full">
        <div className="px-5 pt-6">
          <div className="relative">
            {profile.image ? (
              <img
                src={profile.image}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover shadow-lg border-4 border-white absolute -top-8 left-4"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 border-4 border-white shadow-lg absolute -top-8 left-4" />
            )}

            <div className="bg-[#0087C8] text-white rounded-xl pt-10 pb-4 px-4 shadow-md">
              <p className="text-sm opacity-90">Welcome</p>

              <h2 className="text-lg font-semibold leading-tight">
                {profile.name}
              </h2>

              <p className="text-sm opacity-90 mt-1">
                {profile.lga}
              </p>

              <button
                onClick={openPhotoWidget}
                className="mt-3 text-xs font-semibold bg-white text-[#0087C8] px-3 py-2 rounded-full"
              >
                Upload Profile Photo
              </button>
            </div>
          </div>

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

        <div className="mt-auto flex justify-center pb-6">
          <img src="/logo.png" className="w-28 opacity-100" alt="Judified" />
        </div>
      </div>
    </div>
  )
}