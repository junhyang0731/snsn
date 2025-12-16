import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/telegram-client'

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
                // ... (existing codes) ...

                // (Existing approval logic)
                // (Existing approval logic)
                const { data: purchase, error: fetchError } = await supabaseAdmin
                    .from('purchases')
                    .select('*, video:videos(title)')
                    .eq('id', purchaseId)
                    .single()

                if (fetchError || !purchase) {
                    await sendTelegramMessage(chatId, "⚠️ 이미 처리되었거나 찾을 수 없는 주문입니다.")
                    return NextResponse.json({ ok: true })
                }

                if (purchase.status === 'completed') {
                    await sendTelegramMessage(chatId, "✅ 이미 승인된 주문입니다.")
                    return NextResponse.json({ ok: true })
                }

                // 1. Check & Lock Stock (FIFO)
                const { data: stockItem, error: stockError } = await supabaseAdmin
                    .from('product_stock')
                    .select('id, filename')
                    .eq('product_id', purchase.video_id)
                    .eq('is_sold', false)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .single()

                if (stockError || !stockItem) {
                    await sendTelegramMessage(chatId, `⚠️ 승인 실패: '${purchase.video?.title || "상품"}' 재고가 부족합니다!\n(관리자 페이지에서 재고를 추가해주세요)`)
                    return NextResponse.json({ ok: true })
                }

                // 2. Update Stock (Mark as Sold)
                const { error: stockUpdateError } = await supabaseAdmin
                    .from('product_stock')
                    .update({
                        is_sold: true,
                        buyer_id: purchase.user_id,
                        sold_at: new Date().toISOString()
                    })
                    .eq('id', stockItem.id)

                if (stockUpdateError) {
                    await sendTelegramMessage(chatId, `❌ 시스템 오류: 재고 할당 실패`)
                    return NextResponse.json({ ok: true })
                }

                // 3. Update Purchase Status & Decrement Video Stock Counter
                const { error: updateError } = await supabaseAdmin
                    .from('purchases')
                    .update({ status: 'completed' })
                    .eq('id', purchaseId)

                // Decrement video stock display count (Optional but good for UI sync)
                await supabaseAdmin.rpc('decrement_stock', { video_uuid: purchase.video_id })

                if (updateError) {
                    await sendTelegramMessage(chatId, `❌ 승인 실패: ${updateError.message}`)
                } else {
                    const parts = purchase.payment_method?.split(':') || []
                    const name = parts.length > 2 ? parts[2] : "구매자"
                    await sendTelegramMessage(chatId, `✅ <b>${name}</b>님의 주문이 승인되었습니다.\n📦 발송된 파일: ${stockItem.filename}\n💰 금액: ${purchase.amount.toLocaleString()}원`)
                }
            } else if (data.startsWith("reply_chat:")) {
                const targetUserId = data.split(":")[1]
                await sendTelegramMessage(chatId, `💬 [user:${targetUserId}] 님에게 답장을 입력하세요.`, {
                    reply_markup: { force_reply: true }
                })
            }
            return NextResponse.json({ ok: true })
        }

        // 2. Handle Message
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true })
        }

        const chatId = update.message.chat.id
        const text = update.message.text.trim()

        // Handle Reply to Chat Message
        if (update.message.reply_to_message) {
            const originalText = update.message.reply_to_message.text
            const match = originalText.match(/\[user:([a-f0-9-]+)\]/)

            if (match && match[1]) {
                const targetUserId = match[1]

                // Insert into messages table
                const { error } = await supabaseAdmin.from('messages').insert({
                    user_id: targetUserId,
                    content: text,
                    is_admin: true
                })

                if (error) {
                    await sendTelegramMessage(chatId, `❌ 전송 실패: ${error.message}`)
                } else {
                    await sendTelegramMessage(chatId, `✅ 전송 완료`)
                }
                return NextResponse.json({ ok: true })
            }
        }

        // Command: /start (Register Admin)
        if (text === "/start") {
            // Create table if not exists (Hack, better via SQL)
            // We just insert to 'admin_telegram_ids'
            const { error } = await supabaseAdmin.from('admin_telegram_ids').upsert({ chat_id: chatId })
            if (error) {
                await sendTelegramMessage(chatId, "❌ 등록 실패. 'admin_telegram_ids' 테이블이 있는지 확인하세요.")
            } else {
                await sendTelegramMessage(chatId, "✅ 관리자 알림이 등록되었습니다.")
            }
            return NextResponse.json({ ok: true })
        }

        // Command: /전체
        if (text === "/전체") {
            const { data: purchases, error } = await supabaseAdmin
                .from('purchases')
                .select('*, video:videos(title)')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (error) {
                await sendTelegramMessage(chatId, "DB Error")
                return NextResponse.json({ ok: true })
            }

            if (!purchases || purchases.length === 0) {
                await sendTelegramMessage(chatId, "현재 대기 중인 입금 내역이 없습니다.")
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

            await sendTelegramMessage(chatId, msg)
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
            await sendTelegramMessage(chatId, `Error: ${error.message}`)
            return NextResponse.json({ ok: true })
        }

        if (!purchases || purchases.length === 0) {
            await sendTelegramMessage(chatId, `❌ '${depositorName}' 님으로 대기 중인 주문이 없습니다.`)
            return NextResponse.json({ ok: true })
        }

        // Show interactive approval for each match
        for (const p of purchases) {
            const parts = p.payment_method?.split(':') || []
            const bank = parts[1] || "은행미상"
            const name = parts[2] || "이름미상"

            const message = `🔎 <b>입금 확인 요청</b>\n\n🏦 <b>${bank} ${name}</b> 이 맞습니까?\n💰 필요 금액: <b>${p.amount.toLocaleString()}원</b>\n📦 상품: ${p.video?.title}\n\n승인하시겠습니까?`

            await sendTelegramMessage(chatId, message, {
                reply_markup: {
                    inline_keyboard: [[
                        { text: "✅ 승인하기", callback_data: `approve:${p.id}` }
                    ]]
                }
            })
        }

        return NextResponse.json({ ok: true })

    } catch (error) {
        console.error("Telegram Webhook Error:", error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}


