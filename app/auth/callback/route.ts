import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) throw error

      if (data.user) {
        const { data: existingProfiles } = await supabase.from("profiles").select("id", { count: "exact" }).limit(1)

        const isFirstUser = !existingProfiles || existingProfiles.length === 0

        await supabase.from("profiles").upsert({
          id: data.user.id,
          display_name: data.user.user_metadata?.display_name || "User",
          email: data.user.email,
          coin_balance: 0,
          is_admin: isFirstUser, // 첫 가입자는 자동으로 어드민
        })
      }
    } catch (error) {
      console.error("[v0] Auth error:", error)
      return NextResponse.redirect(new URL("/auth/login?error=Email verification failed", request.url))
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
