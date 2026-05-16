"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

type Profile = {
  id: string
  email: string
  name: string
  constituency: string
  lga: string
  image: string | null
  role: string
}

type ReportRow = {
  id: string
  user_email: string
  type: "video" | "image" | "audio" | "text" | string
  comment: string | null
  status: string | null
  created_at: string
  files: string[] | null
  judith: number | null
  eunice: number | null
  okpolupm: number | null
}

type AgentSummary = Profile & {
  reportsCount: number
  lastReportAt: string | null
  lastStatus: string | null
}

type MergedReport = ReportRow & {
  agent: Profile | null
}

const normalizeStatus = (status?: string | null) => {
  if (!status || status === "pending") return "new"
  return status
}

export default function AdminPage() {
  const router = useRouter()

  const [reports, setReports] = useState<ReportRow[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [checkingAuth, setCheckingAuth] = useState(true)

  const [viewTab, setViewTab] = useState<"reports" | "agents">("reports")
  const [activeTab, setActiveTab] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [date, setDate] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [reportPage, setReportPage] = useState(1)
  const [agentPage, setAgentPage] = useState(1)
  const [pageSize, setPageSize] = useState(8)

  useEffect(() => {
    const updatePageSize = () => {
      setPageSize(window.innerWidth < 768 ? 4 : 8)
    }

    updatePageSize()
    window.addEventListener("resize", updatePageSize)
    return () => window.removeEventListener("resize", updatePageSize)
  }, [])

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push("/admin-login")
        return
      }

      setCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  const fetchData = async () => {
    const [reportsRes, profilesRes] = await Promise.all([
      supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("*")
        .order("name", { ascending: true }),
    ])

    if (reportsRes.error) {
      console.error(reportsRes.error)
      toast.error("Could not load reports")
    } else {
      setReports((reportsRes.data || []) as ReportRow[])
    }

    if (profilesRes.error) {
      console.error(profilesRes.error)
      toast.error("Could not load agent profiles")
    } else {
      setProfiles((profilesRes.data || []) as Profile[])
    }
  }

  useEffect(() => {
    if (checkingAuth) return

    fetchData()

    const reportsChannel = supabase
      .channel("reports-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => fetchData()
      )
      .subscribe()

    const profilesChannel = supabase
      .channel("profiles-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(reportsChannel)
      supabase.removeChannel(profilesChannel)
    }
  }, [checkingAuth])

  const profilesByEmail = useMemo(() => {
    const map: Record<string, Profile> = {}

    profiles.forEach((profile) => {
      map[profile.email.toLowerCase()] = profile
    })

    return map
  }, [profiles])

  const mergedReports: MergedReport[] = useMemo(() => {
    return reports.map((report) => ({
      ...report,
      agent: profilesByEmail[report.user_email?.toLowerCase()] || null,
    }))
  }, [reports, profilesByEmail])

  const filteredReports = useMemo(() => {
    let data = [...mergedReports]

    if (activeTab !== "all") {
      data = data.filter((r) => r.type === activeTab)
    }

    if (statusFilter !== "all") {
      data = data.filter((r) => normalizeStatus(r.status) === statusFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()

      data = data.filter((r) => {
        const name = r.agent?.name?.toLowerCase() || ""
        const email = r.user_email?.toLowerCase() || ""
        const lga = r.agent?.lga?.toLowerCase() || ""
        const constituency = r.agent?.constituency?.toLowerCase() || ""
        const comment = r.comment?.toLowerCase() || ""

        return (
          name.includes(q) ||
          email.includes(q) ||
          lga.includes(q) ||
          constituency.includes(q) ||
          comment.includes(q)
        )
      })
    }

    if (date) {
      data = data.filter((r) => r.created_at?.startsWith(date))
    }

    return data
  }, [mergedReports, activeTab, statusFilter, search, date])

  const agents: AgentSummary[] = useMemo(() => {
    const agentProfiles = profiles.filter((p) => p.role !== "admin")

    const summaries = agentProfiles.map((profile) => {
      const relatedReports = reports
        .filter(
          (r) => r.user_email?.toLowerCase() === profile.email.toLowerCase()
        )
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))

      return {
        ...profile,
        reportsCount: relatedReports.length,
        lastReportAt: relatedReports[0]?.created_at || null,
        lastStatus: relatedReports[0]?.status || null,
      }
    })

    if (!search.trim()) return summaries

    const q = search.trim().toLowerCase()

    return summaries.filter((agent) => {
      return (
        agent.name?.toLowerCase().includes(q) ||
        agent.email?.toLowerCase().includes(q) ||
        agent.lga?.toLowerCase().includes(q) ||
        agent.constituency?.toLowerCase().includes(q)
      )
    })
  }, [profiles, reports, search])

  useEffect(() => {
    setReportPage(1)
  }, [activeTab, statusFilter, search, date])

  useEffect(() => {
    setAgentPage(1)
  }, [search, viewTab])

  const stats = useMemo(() => {
    return {
      totalReports: reports.length,
      totalAgents: profiles.filter((p) => p.role !== "admin").length,
      newCount: reports.filter((r) => normalizeStatus(r.status) === "new").length,
      viewedCount: reports.filter((r) => normalizeStatus(r.status) === "viewed").length,
      video: reports.filter((r) => r.type === "video").length,
      image: reports.filter((r) => r.type === "image").length,
      audio: reports.filter((r) => r.type === "audio").length,
      text: reports.filter((r) => r.type === "text").length,
    }
  }, [reports, profiles])

  const updateStatus = async (id: string, nextStatus: string) => {
    const { error } = await supabase
      .from("reports")
      .update({ status: nextStatus })
      .eq("id", id)

    if (error) {
      console.error(error)
      toast.error("Status update failed")
      return false
    }

    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r))
    )

    return true
  }

  const openReport = async (id: string, currentStatus: string | null) => {
    const status = normalizeStatus(currentStatus)

    if (status === "new") {
      await updateStatus(id, "viewed")
    }

    setExpandedId((prev) => (prev === id ? null : id))
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/admin-login")
  }

  const downloadCSV = (rows: (string | number)[][], filename: string) => {
    const csv = rows
      .map((row) => row.map((cell) => String(cell)).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    if (viewTab === "agents") {
      const rows = [
        ["Name", "Email", "LGA", "Constituency", "Reports", "Last Report", "Last Status"],
        ...agents.map((a) => [
          a.name,
          a.email,
          a.lga,
          a.constituency,
          String(a.reportsCount),
          a.lastReportAt || "",
          normalizeStatus(a.lastStatus),
        ]),
      ]

      downloadCSV(rows, "agents.csv")
      return
    }

    const rows = [
      ["Agent Name", "Email", "LGA", "Constituency", "Type", "Comment", "Date", "Status", "Judith", "Eunice", "Okpolupm"],
      ...filteredReports.map((r) => [
        r.agent?.name || "",
        r.user_email,
        r.agent?.lga || "",
        r.agent?.constituency || "",
        r.type,
        `"${(r.comment || "").replace(/"/g, '""')}"`,
        r.created_at,
        normalizeStatus(r.status),
        r.judith ?? "",
        r.eunice ?? "",
        r.okpolupm ?? "",
      ]),
    ]

    downloadCSV(rows, "reports.csv")
  }

  const reportTotalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize))
  const agentTotalPages = Math.max(1, Math.ceil(agents.length / pageSize))

  const paginatedReports = filteredReports.slice(
    (reportPage - 1) * pageSize,
    reportPage * pageSize
  )

  const paginatedAgents = agents.slice(
    (agentPage - 1) * pageSize,
    agentPage * pageSize
  )

  const formatDate = (value?: string | null) => {
    if (!value) return "-"
    return new Date(value).toLocaleString()
  }

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
      <div
        className="absolute top-0 left-0 w-full h-[40%] bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: "url('/bg.png')" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-2 py-3 pb-24 md:px-3">
        <div className="bg-[#2DBE6C] text-white rounded-2xl p-3 md:p-4 shadow-md mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-bold leading-tight">
              Admin Dashboard
            </h1>
            <p className="text-[11px] md:text-xs opacity-80 mt-0.5">
              Monitor agents, reports, files, and status in one place
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="bg-white text-[#2DBE6C] px-3 py-2 rounded-lg text-xs md:text-sm font-semibold active:scale-95 transition-transform"
            >
              Export CSV
            </button>
            <button
              onClick={logout}
              className="bg-white text-[#2DBE6C] px-3 py-2 rounded-lg text-xs md:text-sm font-semibold active:scale-95 transition-transform"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <StatCard label="Reports" value={stats.totalReports} />
          <StatCard label="Agents" value={stats.totalAgents} />
          <StatCard label="New" value={stats.newCount} />
          <StatCard label="Viewed" value={stats.viewedCount} />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          <StatCard label="Video" value={stats.video} />
          <StatCard label="Image" value={stats.image} />
          <StatCard label="Audio" value={stats.audio} />
          <StatCard label="Text" value={stats.text} />
        </div>

        <div className="flex flex-col gap-2 mb-3">
          <input
            placeholder={
              viewTab === "agents"
                ? "Search by agent name, email, constituency..."
                : "Search by agent name, email, constituency or comment..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white outline-none text-sm focus:ring-2 focus:ring-[#2DBE6C] shadow-sm"
          />

          {viewTab === "reports" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 p-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-[#2DBE6C] shadow-sm"
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          <button
            onClick={() => setViewTab("reports")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              viewTab === "reports"
                ? "bg-[#2DBE6C] text-white shadow"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            Reports
          </button>

          <button
            onClick={() => setViewTab("agents")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              viewTab === "agents"
                ? "bg-[#2DBE6C] text-white shadow"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            Agents
          </button>

          {viewTab === "reports" &&
            ["all", "video", "image", "audio", "text"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  activeTab === tab
                    ? "bg-[#0087C8] text-white shadow"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
        </div>

        {viewTab === "reports" ? (
          <>
            {filteredReports.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm">No reports found</p>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              {paginatedReports.map((r) => {
                const isExpanded = expandedId === r.id
                const agent = r.agent
                const status = normalizeStatus(r.status)

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                  >
                    <button
                      className="w-full text-left p-3 md:p-4"
                      onClick={() => openReport(r.id, r.status)}
                    >
                      <div className="flex items-start gap-3">
                        {agent?.image ? (
                          <img
                            src={agent.image}
                            alt={agent.name}
                            className="w-11 h-11 md:w-12 md:h-12 rounded-full object-cover border-2 border-white shadow"
                          />
                        ) : (
                          <div className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-gray-200 border-2 border-white shadow" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate">
                                {agent?.name || r.user_email}
                              </p>
                              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                {r.user_email}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                                {agent?.lga || "LGA not set"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
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

                              <span
                                className={`text-gray-400 text-xs transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              >
                                ▼
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                status === "viewed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {status === "viewed" ? "Viewed" : "New"}
                            </span>

                            {r.comment && (
                              <p className="text-[11px] text-gray-500 truncate flex-1">
                                {r.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 md:px-4 pb-4 border-t border-gray-100 pt-3">
                        <div className="bg-[#f8fbff] rounded-2xl p-3 mb-3">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase mb-2">
                            Agent details
                          </p>

                          <div className="flex items-center gap-3">
                            {agent?.image ? (
                              <img
                                src={agent.image}
                                alt={agent.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow" />
                            )}

                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-800">
                                {agent?.name || "Agent not found"}
                              </p>
                              <p className="text-[11px] text-gray-500 truncate">
                                {r.user_email}
                              </p>
                              <p className="text-[11px] text-gray-500 mt-0.5">
                                {agent?.constituency || "Constituency not set"}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {agent?.lga || "LGA not set"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {r.comment && (
                          <p className="text-sm text-gray-700 mb-3 bg-gray-50 rounded-xl p-3">
                            {r.comment}
                          </p>
                        )}

                        {(r.judith || r.eunice || r.okpolupm) && (
                          <div className="mb-4 bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-gray-500 mb-2">
                              Result Scores
                            </p>

                            <div className="space-y-2 text-sm">
                              {r.judith !== null && r.judith !== undefined && (
                                <div className="flex justify-between">
                                  <span>Judith Mayen Ogbara</span>
                                  <span className="font-semibold">{r.judith}</span>
                                </div>
                              )}

                              {r.eunice !== null && r.eunice !== undefined && (
                                <div className="flex justify-between">
                                  <span>Eunice Thomas</span>
                                  <span className="font-semibold">{r.eunice}</span>
                                </div>
                              )}

                              {r.okpolupm !== null && r.okpolupm !== undefined && (
                                <div className="flex justify-between">
                                  <span>Okpolupm Etteh</span>
                                  <span className="font-semibold">{r.okpolupm}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {r.files && r.files.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {r.files.map((file, i) => {
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
                                      className="rounded-xl h-40 w-full object-cover"
                                    />
                                  )}

                                  {isVideo && (
                                    <video
                                      src={file}
                                      controls
                                      className="rounded-xl h-40 w-full object-cover bg-black"
                                    />
                                  )}

                                  {isAudio && (
                                    <audio src={file} controls className="w-full" />
                                  )}

                                  <a
                                    href={file}
                                    download
                                    className="text-xs text-[#0087C8] font-medium text-center py-2 bg-blue-50 rounded-lg"
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

            {reportTotalPages > 1 && (
              <Pager
                page={reportPage}
                totalPages={reportTotalPages}
                onPrev={() => setReportPage((p) => Math.max(1, p - 1))}
                onNext={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}
                onJump={setReportPage}
              />
            )}
          </>
        ) : (
          <>
            {agents.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm">No agents found</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {paginatedAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    {agent.image ? (
                      <img
                        src={agent.image}
                        alt={agent.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-gray-800 truncate">
                        {agent.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm">
                    <p className="text-gray-600 text-xs">
                      <span className="font-semibold text-gray-800">LGA:</span> {agent.lga}
                    </p>
                    <p className="text-gray-600 text-xs">
                      <span className="font-semibold text-gray-800">Constituency:</span>{" "}
                      {agent.constituency}
                    </p>
                    <p className="text-gray-600 text-xs">
                      <span className="font-semibold text-gray-800">Reports:</span>{" "}
                      {agent.reportsCount}
                    </p>
                    <p className="text-gray-600 text-xs">
                      <span className="font-semibold text-gray-800">Last report:</span>{" "}
                      {formatDate(agent.lastReportAt)}
                    </p>
                    <p className="text-gray-600 text-xs">
                      <span className="font-semibold text-gray-800">Last status:</span>{" "}
                      {normalizeStatus(agent.lastStatus) === "viewed" ? "Viewed" : "New"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setViewTab("reports")
                      setSearch(agent.email)
                      setExpandedId(null)
                    }}
                    className="mt-3 w-full bg-[#0087C8] text-white py-2.5 rounded-xl text-sm font-semibold"
                  >
                    View Reports
                  </button>
                </div>
              ))}
            </div>

            {agentTotalPages > 1 && (
              <Pager
                page={agentPage}
                totalPages={agentTotalPages}
                onPrev={() => setAgentPage((p) => Math.max(1, p - 1))}
                onNext={() => setAgentPage((p) => Math.min(agentTotalPages, p + 1))}
                onJump={setAgentPage}
              />
            )}
          </>
        )}
      </div>

      <div className="fixed bottom-4 left-0 w-full flex justify-center pointer-events-none z-20">
        <img src="/logo.png" className="w-20 opacity-70" alt="logo" />
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-2 py-2.5 text-center">
      <p className="text-[10px] text-gray-500 uppercase font-medium">{label}</p>
      <p className="font-bold text-lg text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

function Pager({
  page,
  totalPages,
  onPrev,
  onNext,
  onJump,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  onJump: (page: number) => void
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold disabled:opacity-40"
      >
        Prev
      </button>

      <div className="flex items-center gap-1 overflow-x-auto">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onJump(p)}
            className={`min-w-9 px-3 py-2 rounded-xl text-sm font-semibold ${
              p === page
                ? "bg-[#2DBE6C] text-white"
                : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}