import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAdminUser() {
  try {
    console.log("Creating admin user...")

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@snacksnake.com",
      password: "admin123!!",
      email_confirm: true,
      user_metadata: {
        display_name: "Admin",
        username: "admin",
      },
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      process.exit(1)
    }

    if (!authData.user) {
      console.error("No user returned from auth creation")
      process.exit(1)
    }

    console.log("Auth user created:", authData.user.id)

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: "admin",
        display_name: "Admin",
        is_admin: true,
        coin_balance: 1000, // Give admin some initial balance
      })
      .eq("id", authData.user.id)

    if (profileError) {
      console.error("Error updating profile:", profileError)
      process.exit(1)
    }

    console.log("✅ Admin user created successfully!")
    console.log("📧 Email: admin@snacksnake.com")
    console.log("🔑 Username: admin")
    console.log("🔐 Password: admin123!!")
    console.log("💰 Initial coin balance: 1000 LTC")
  } catch (error) {
    console.error("Unexpected error:", error)
    process.exit(1)
  }
}

createAdminUser()
