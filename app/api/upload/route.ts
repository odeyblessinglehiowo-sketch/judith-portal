import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(req: Request) {
  try {
    // ✅ Check env vars in terminal
    console.log("ENV CHECK:", {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      has_secret: !!process.env.CLOUDINARY_API_SECRET,
    })

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    const uploadResults = []

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "auto" },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      })

      uploadResults.push(result)
    }

    return NextResponse.json(uploadResults)

  } catch (error) {
    console.error("CLOUDINARY ERROR:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}