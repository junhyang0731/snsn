
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram-client'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { userId, content } = body

        console.log(`[Chat Notify] Request received for ${userId}`)

        // Get admin telegram IDs
        const { data: admins, error } = await supabaseAdmin.from("admin_telegram_ids").select("chat_id")

        if (error) {
            console.error("[Chat Notify] DB Error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // If no admins registered, just return
        if (!admins || admins.length === 0) {
            console.log("[Chat Notify] No admins found in DB.")
            return NextResponse.json({ ok: false, reason: "No admins" })
        }

        console.log(`[Chat Notify] Found ${admins.length} admins. Sending...`)

        const time = new Date().toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
            hour12: true,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })

        const message = `💬 <b>1:1 문의 도착</b>\n\n[User]: ${userId}\n[Time]: ${time}\n\n${content}`

        const results = await Promise.all(admins.map(admin =>
            sendTelegramMessage(admin.chat_id, message, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✉️ 답장하기", callback_data: `reply_chat:${userId}` }
                    ]]
                }
            })
        ))

        console.log("[Chat Notify] Current Status: Done")

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error("[Chat Notify] Critical Error", e)
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}
