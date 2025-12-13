import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin Client
// REQUIRES: SUPABASE_SERVICE_ROLE_KEY in .env.local
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export async function POST(request: Request) {
    try {
        if (!TELEGRAM_BOT_TOKEN || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Env Variables: TELEGRAM_BOT_TOKEN or SUPABASE_SERVICE_ROLE_KEY")
            return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 })
        }

        const update = await request.json()

        // 1. Handle Callback Query (Button Click)
        if (update.callback_query) {
            const query = update.callback_query
            const chatId = query.message.chat.id
            const data = query.data // "approve:UUID"

            if (data.startsWith("approve:")) {
                const purchaseId = data.split(":")[1]

                // Fetch purchase to get basics
                const { data: purchase, error: fetchError } = await supabaseAdmin
                    .from('purchases')
                    .select('*')
                    .eq('id', purchaseId)
                    .single()

                if (fetchError || !purchase) {
                    await sendMessage(chatId, "⚠️ 이미 처리되었거나 찾을 수 없는 주문입니다.")
                    return NextResponse.json({ ok: true })
                }

                if (purchase.status === 'completed') {
                    await sendMessage(chatId, "✅ 이미 승인된 주문입니다.")
                    return NextResponse.json({ ok: true })
                }

                // Update Status
                const { error: updateError } = await supabaseAdmin
                    .from('purchases')
                    .update({ status: 'completed' })
                    .eq('id', purchaseId)

                if (updateError) {
                    await sendMessage(chatId, `❌ 승인 실패: ${updateError.message}`)
                } else {
                    // Extract name from payment_method
                    // format: bank_transfer:Bank:Name
                    const parts = purchase.payment_method?.split(':') || []
                    const name = parts.length > 2 ? parts[2] : "구매자"

                    await sendMessage(chatId, `✅ <b>${name}</b>님의 주문이 승인되었습니다.\n금액: ${purchase.amount.toLocaleString()}원`)
                }
            }
            return NextResponse.json({ ok: true })
        }

        // 2. Handle Message
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true })
        }

        const chatId = update.message.chat.id
        const text = update.message.text.trim()

        // Command: /전체
        if (text === "/전체") {
            const { data: purchases, error } = await supabaseAdmin
                .from('purchases')
                .select('*, video:videos(title)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) {
                await sendMessage(chatId, "DB Error")
                return NextResponse.json({ ok: true })
            }

            if (!purchases || purchases.length === 0) {
                await sendMessage(chatId, "현재 대기 중인 입금 내역이 없습니다.")
                return NextResponse.json({ ok: true })
            }

            let msg = "📋 <b>입금 대기 목록</b>\n\n"
            purchases.forEach((p, i) => {
                const parts = p.payment_method?.split(':') || []
                const bank = parts[1] || "?"
                const name = parts[2] || "?"
                msg += `${i + 1}. <b>${name}</b> (${bank})\n   💰 ${p.amount.toLocaleString()}원 | ${p.video?.title}\n\n`
            })
            msg += "이름을 입력하면 승인 메뉴가 뜹니다."

            await sendMessage(chatId, msg)
            return NextResponse.json({ ok: true })
        }

        // Command: Depositor Name (Search)
        const depositorName = text.split(' ')[0]

        const { data: purchases, error } = await supabaseAdmin
            .from('purchases')
            .select('*, video:videos(title)')
            .eq('status', 'pending')
            .ilike('payment_method', `%:${depositorName}`)

        if (error) {
            await sendMessage(chatId, `Error: ${error.message}`)
            return NextResponse.json({ ok: true })
        }

        if (!purchases || purchases.length === 0) {
            await sendMessage(chatId, `❌ '${depositorName}' 님으로 대기 중인 주문이 없습니다.`)
            return NextResponse.json({ ok: true })
        }

        // Show interactive approval for each match
        for (const p of purchases) {
            const parts = p.payment_method?.split(':') || []
            const bank = parts[1] || "은행미상"
            const name = parts[2] || "이름미상"

            const message = `🔎 <b>입금 확인 요청</b>\n\n🏦 <b>${bank} ${name}</b> 이 맞습니까?\n💰 필요 금액: <b>${p.amount.toLocaleString()}원</b>\n📦 상품: ${p.video?.title}\n\n승인하시겠습니까?`

            await sendMessageWithButton(chatId, message, p.id)
        }

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error("Telegram Webhook Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

async function sendMessage(chatId: number, text: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML'  // Allow bold text
            }),
        })
    } catch (e) {
        console.error("Failed to send Telegram message", e)
    }
}

async function sendMessageWithButton(chatId: number, text: string, purchaseId: string) {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    try {
        await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ 승인하기", callback_data: `approve:${purchaseId}` }
                    ]]
                }
            }),
        })
    } catch (e) {
        console.error("Failed to send Telegram message", e)
    }
}
