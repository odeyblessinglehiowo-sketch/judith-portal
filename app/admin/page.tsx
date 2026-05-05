"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AdminPage() {
  const router = useRouter()

  // ✅ ALL useState at the top — no exceptions
  const [reports, setReports] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [search, setSearch] = useState("")
  const [date, setDate] = useState("")
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 🔐 AUTH CHECK — single, clean, correct
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/admin-login")
      } else {
        setCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router])

  // 📡 FETCH + REALTIME
  useEffect(() => {
    if (checkingAuth) return

    fetchReports()

    const channel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => fetchReports()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [checkingAuth])

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })

    if (data) {
      setReports(data)
      setFiltered(data)
    }
  }

  // 🔍 FILTERING
  useEffect(() => {
    let data = [...reports]

    if (activeTab !== "all") {
      data = data.filter((r) => r.type === activeTab)
    }

    if (search) {
      data = data.filter((r) =>
        r.user_email?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (date) {
      data = data.filter((r) => r.created_at?.startsWith(date))
    }

    setFiltered(data)
  }, [search, activeTab, date, reports])

  // 📊 STATS
  const stats = {
    total: reports.length,
    video: reports.filter((r) => r.type === "video").length,
    image: reports.filter((r) => r.type === "image").length,
    audio: reports.filter((r) => r.type === "audio").length,
    text: reports.filter((r) => r.type === "text").length,
  }

  // 🟢 STATUS UPDATE
  const updateStatus = async (id: string, status: string) => {
    await supabase.from("reports").update({ status }).eq("id", id)
    fetchReports()
  }

  // 🚪 LOGOUT
  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/admin-login")
  }

  // 📤 EXPORT CSV
  const exportCSV = () => {
    const csv = [
      ["Email", "Type", "Comment", "Date", "Status"],
      ...filtered.map((r) => [
        r.user_email,
        r.type,
        `"${(r.comment || "").replace(/"/g, '""')}"`,
        r.created_at,
        r.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "reports.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // ⏳ Auth loading screen
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-[#2DBE6C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Checking access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#f5f7f6] overflow-hidden">

      {/* BG */}
      <div
        className="absolute top-0 left-0 w-full h-[40%] bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-3 py-4 pb-24">

        {/* HEADER */}
        <div className="bg-[#2DBE6C] text-white rounded-2xl p-4 shadow-md mb-4 flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold leading-tight">Admin Dashboard</h1>
            <p className="text-xs opacity-80 mt-0.5">Monitor all incoming reports</p>
          </div>
          <button
            onClick={logout}
            className="bg-white text-[#2DBE6C] px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
          >
            Logout
          </button>
        </div>

        {/* 📊 STATS — scrollable row on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {Object.entries(stats).map(([key, val]) => (
            <div
              key={key}
              className="bg-white flex-shrink-0 px-4 py-2.5 rounded-xl shadow text-center min-w-[70px]"
            >
              <p className="text-[11px] text-gray-500 uppercase font-medium">{key}</p>
              <p className="font-bold text-xl text-gray-800">{val}</p>
            </div>
          ))}
        </div>

        {/* 🔍 SEARCH + DATE */}
        <div className="flex flex-col gap-2 mb-3">
          <input
            placeholder="Search by agent email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none text-sm focus:ring-2 focus:ring-[#2DBE6C] shadow-sm"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-[#2DBE6C] shadow-sm"
            />
            <button
              onClick={exportCSV}
              className="bg-[#0087C8] text-white px-4 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-transform whitespace-nowrap"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* TABS — horizontally scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {["all", "video", "image", "audio", "text"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                activeTab === tab
                  ? "bg-[#2DBE6C] text-white shadow"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-sm">No reports found</p>
          </div>
        )}

        {/* REPORT CARDS */}
        <div className="flex flex-col gap-3">
          {filtered.map((r) => {
            const isExpanded = expandedId === r.id

            return (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* CARD HEADER — always visible, tap to expand */}
                <button
                  className="w-full text-left p-4"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {r.user_email}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* TYPE BADGE */}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.type === "video"
                            ? "bg-purple-100 text-purple-700"
                            : r.type === "image"
                            ? "bg-blue-100 text-blue-700"
                            : r.type === "audio"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {r.type}
                      </span>

                      {/* CHEVRON */}
                      <span className={`text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* STATUS + COMMENT PREVIEW */}
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === "reviewed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {r.status || "pending"}
                    </span>
                    {r.comment && (
                      <p className="text-xs text-gray-500 truncate flex-1">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </button>

                {/* EXPANDED CONTENT */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">

                    {/* FULL COMMENT */}
                    {r.comment && (
                      <p className="text-sm text-gray-700 mb-3 bg-gray-50 rounded-lg p-3">
                        {r.comment}
                      </p>
                    )}
{/* 🧮 RESULTS */}
{(r.judith || r.eunice || r.okpolupm) && (
  <div className="mb-4 bg-gray-50 rounded-xl p-3">
    <p className="text-xs font-semibold text-gray-500 mb-2">
      Result Scores
    </p>

    <div className="space-y-2 text-sm">
      {r.judith !== null && (
        <div className="flex justify-between">
          <span>Judith Mayen Ogbara</span>
          <span className="font-semibold">{r.judith}</span>
        </div>
      )}

      {r.eunice !== null && (
        <div className="flex justify-between">
          <span>Eunice Thomas</span>
          <span className="font-semibold">{r.eunice}</span>
        </div>
      )}

      {r.okpolupm !== null && (
        <div className="flex justify-between">
          <span>Okpolupm Etteh</span>
          <span className="font-semibold">{r.okpolupm}</span>
        </div>
      )}
    </div>
  </div>
)}
                    {/* STATUS SELECTOR */}
                    <div className="flex items-center gap-2 mb-3">
                      <label className="text-xs text-gray-500 font-medium">Status:</label>
                      <select
                        value={r.status || "pending"}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-[#2DBE6C]"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                      </select>
                    </div>

                    {/* FILES */}
                    {r.files && r.files.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {r.files.map((file: string, i: number) => {
                          const ext = file.split(".").pop()?.toLowerCase() ?? ""
                          const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)
                          const isVideo = ["mp4", "mov", "webm"].includes(ext)
                          const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext)

                          return (
                            <div key={i} className="flex flex-col gap-1">
                              {isImage && (
                                <img
                                  src={file}
                                  alt={`file-${i}`}
                                  className="rounded-xl h-28 w-full object-cover"
                                />
                              )}
                              {isVideo && (
                                <video
                                  src={file}
                                  controls
                                  className="rounded-xl h-28 w-full object-cover"
                                />
                              )}
                              {isAudio && (
                                <audio src={file} controls className="w-full" />
                              )}
                              <a
                                href={file}
                                download
                                className="text-xs text-[#0087C8] font-medium text-center py-1 bg-blue-50 rounded-lg"
                              >
                                ↓ Download
                              </a>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div className="fixed bottom-4 left-0 w-full flex justify-center pointer-events-none z-20">
        <img src="/logo.png" className="w-20 opacity-70" alt="logo" />
      </div>

    </div>
  )
}