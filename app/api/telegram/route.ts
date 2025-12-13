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

        // Valid Message Check
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true }) // Return OK to stop Telegram from retrying
        }

        const chatId = update.message.chat.id
        const text = update.message.text.trim()

        // Assume input is "DepositorName" or "DepositorName BankName"
        // We strictly match the DepositorName part against our records
        // payment_method format: "bank_transfer:BankName:DepositorName"

        // Simple heuristic: If multiple words, take the first word as Name?
        // Or just search the whole string if it's unique enough.
        // Let's assume the user inputs EXACTLY the depositor name they entered in Checkout.
        const depositorName = text.split(' ')[0] // Take first word if they type "Hong KB"

        // Find Pending Purchase
        const { data: purchases, error } = await supabaseAdmin
            .from('purchases')
            .select('*')
            .eq('status', 'pending')
            .ilike('payment_method', `%:${depositorName}`)
        // This matches "...:DepositorName" inside the string

        if (error) {
            await sendMessage(chatId, `⚠️ 데이터베이스 오류: ${error.message}`)
            return NextResponse.json({ ok: true })
        }

        if (!purchases || purchases.length === 0) {
            await sendMessage(chatId, `❌ '${depositorName}' 이름으로 대기 중인 주문이 없습니다.`)
            return NextResponse.json({ ok: true })
        }

        if (purchases.length > 1) {
            await sendMessage(chatId, `⚠️ '${depositorName}' 이름으로 ${purchases.length}건의 주문이 있습니다. 웹사이트에서 수동으로 확인해주세요.`)
            return NextResponse.json({ ok: true })
        }

        // Exact 1 match found
        const purchase = purchases[0]

        // Approve
        const { error: updateError } = await supabaseAdmin
            .from('purchases')
            .update({ status: 'completed' })
            .eq('id', purchase.id)

        if (updateError) {
            await sendMessage(chatId, `❌ 처리 실패: ${updateError.message}`)
        } else {
            await sendMessage(chatId, `✅ 입금 확인 완료!\n\n구매자: ${depositorName}\n금액: ${purchase.amount}원\n주문ID: ${purchase.id}`)
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
            body: JSON.stringify({ chat_id: chatId, text }),
        })
    } catch (e) {
        console.error("Failed to send Telegram message", e)
    }
}
