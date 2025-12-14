
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service Role Key is required to update messages strictly
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function POST(request: Request) {
    try {
        const { targetUserId } = await request.json()
        if (!targetUserId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

        // Update all unread messages from this user to read
        const { error } = await supabaseAdmin
            .from('messages')
            .update({ is_read: true })
            .eq('user_id', targetUserId)
            .eq('is_admin', false) // Only markers user's messages as read
            .eq('is_read', false)

        if (error) throw error

        return NextResponse.json({ ok: true })
    } catch (e) {
        console.error("Mark Read Error", e)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
