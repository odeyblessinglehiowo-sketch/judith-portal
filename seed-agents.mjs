import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const agents = [
  { name: "Oban 1", email: "oban1@judithportal.com", password: "Oban1@2027!", lga: "Eket Local Government", ward: "Oban 1" },
  { name: "Oban 2", email: "oban2@judithportal.com", password: "Oban2@2027!", lga: "Eket Local Government", ward: "Oban 2" },
  { name: "Oban 3", email: "oban3@judithportal.com", password: "Oban3@2027!", lga: "Eket Local Government", ward: "Oban 3" },
  { name: "Oban 4", email: "oban4@judithportal.com", password: "Oban4@2027!", lga: "Eket Local Government", ward: "Oban 4" },
  { name: "Central 1", email: "central1@judithportal.com", password: "Central1@2027!", lga: "Eket Local Government", ward: "Central 1" },
  { name: "Central 2", email: "central2@judithportal.com", password: "Central2@2027!", lga: "Eket Local Government", ward: "Central 2" },
  { name: "Central 3", email: "central3@judithportal.com", password: "Central3@2027!", lga: "Eket Local Government", ward: "Central 3" },
  { name: "Central 4", email: "central4@judithportal.com", password: "Central4@2027!", lga: "Eket Local Government", ward: "Central 4" },
  { name: "Central 5", email: "central5@judithportal.com", password: "Central5@2027!", lga: "Eket Local Government", ward: "Central 5" },
  { name: "Okon 1", email: "okon1@judithportal.com", password: "Okon1@2027!", lga: "Eket Local Government", ward: "Okon 1" },
  { name: "Okon 2", email: "okon2@judithportal.com", password: "Okon2@2027!", lga: "Eket Local Government", ward: "Okon 2" },

  { name: "Awa Ward 1", email: "awa1@judithportal.com", password: "Awa1@2027!", lga: "Onna Local Government", ward: "Awa Ward 1" },
  { name: "Awa Ward 2", email: "awa2@judithportal.com", password: "Awa2@2027!", lga: "Onna Local Government", ward: "Awa Ward 2" },
  { name: "Awa Ward 3", email: "awa3@judithportal.com", password: "Awa3@2027!", lga: "Onna Local Government", ward: "Awa Ward 3" },
  { name: "Nung-Ndem 1", email: "nungndem1@judithportal.com", password: "NungNdem1@2027!", lga: "Onna Local Government", ward: "Nung-Ndem 1" },
  { name: "Nung-Ndem 2", email: "nungndem2@judithportal.com", password: "NungNdem2@2027!", lga: "Onna Local Government", ward: "Nung-Ndem 2" },
  { name: "Nung-Ndem 3", email: "nungndem3@judithportal.com", password: "NungNdem3@2027!", lga: "Onna Local Government", ward: "Nung-Ndem 3" },
  { name: "Asuna 1", email: "asuna1@judithportal.com", password: "Asuna1@2027!", lga: "Onna Local Government", ward: "Asuna 1" },
  { name: "Asuna 2", email: "asuna2@judithportal.com", password: "Asuna2@2027!", lga: "Onna Local Government", ward: "Asuna 2" },
  { name: "Asuna 3", email: "asuna3@judithportal.com", password: "Asuna3@2027!", lga: "Onna Local Government", ward: "Asuna 3" },
  { name: "Oniong East 1", email: "oniongeast1@judithportal.com", password: "OniongEast1@2027!", lga: "Onna Local Government", ward: "Oniong East 1" },
  { name: "Oniong East 2", email: "oniongeast2@judithportal.com", password: "OniongEast2@2027!", lga: "Onna Local Government", ward: "Oniong East 2" },
  { name: "Oniong West 1", email: "oniongwest1@judithportal.com", password: "OniongWest1@2027!", lga: "Onna Local Government", ward: "Oniong West 1" },
]

async function main() {
  for (const agent of agents) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: agent.email,
      password: agent.password,
      email_confirm: true,
    })

    if (error) {
      console.log(`Auth user failed for ${agent.email}:`, error.message)
      continue
    }

    const userId = data.user.id

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email: agent.email,
      name: agent.name,
      constituency: "Eket Federal Constituency",
      lga: agent.lga,
      ward: agent.ward,
      image: "",
      role: "agent",
    })

    if (profileError) {
      console.log(`Profile failed for ${agent.email}:`, profileError.message)
      continue
    }

    console.log(`Created: ${agent.email}`)
  }
}

main().catch(console.error)