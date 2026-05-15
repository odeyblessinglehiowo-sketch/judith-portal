import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "react-hot-toast"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Judith Portal",
  description: "Judith Election Monitoring Portal",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">

        {/* CLOUDINARY SCRIPT */}
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          type="text/javascript"
        />

        {/* APP */}
        {children}

        {/* TOAST */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1FA463",
              color: "#fff",
            },
          }}
        />

      </body>
    </html>
  )
}