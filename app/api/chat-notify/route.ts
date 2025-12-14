
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram-client'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
    try {
        const { userId, content } = await request.json()

        // Get admin telegram IDs
        const { data: admins } = await supabaseAdmin.from("admin_telegram_ids").select("chat_id")

        // If no admins registered, just return
        if (!admins || admins.length === 0) {
            console.log("No admins registered for Telegram notifications.")
            return NextResponse.json({ ok: true })
        }

        const time = new Date().toLocaleString("ko-KR", {
            timeZone: "Asia/Seoul",
            hour12: true,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })

        // Format: [2024-12-14 PM06:20]
        // Actually simplified:
        const message = `[user:${userId}]\n[${time}]\n[내용: ${content}]`

        for (const admin of admins) {
            await sendTelegramMessage(admin.chat_id, message, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "이곳에 답장하기", callback_data: `reply_chat:${userId}` }
                    ]]
                }
            })
        }

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error("Chat Notify Error", e)
        return NextResponse.json({ error: 'Error' }, { status: 500 })
    }
}
