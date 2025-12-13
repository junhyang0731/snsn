import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const { purchaseId } = await request.json()
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    // We generally don't need to set cookies in this route as we're just verifying auth
                    setAll(cookiesToSet) { }
                }
            }
        )

        // 1. Check User
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })

        // 2. Fetch Purchase & Video data
        const { data: purchase, error } = await supabase
            .from('purchases')
            .select('*, videos!inner(*)') // !inner ensures video exists
            .eq('id', purchaseId)
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .single()

        if (error || !purchase) {
            return NextResponse.json({ error: '구매 내역을 찾을 수 없거나 승인되지 않았습니다.' }, { status: 403 })
        }

        // 3. Extract File Path
        // Supports both old (Public URL) and new (Path) formats
        const desc = purchase.videos.description || ""
        let filePath = ""

        const pathMatch = desc.match(/<!--FILE_PATH:(.*?)-->/)
        if (pathMatch) {
            filePath = pathMatch[1]
        } else {
            // Fallback: Try to extract path from Public URL
            const urlMatch = desc.match(/<!--FILE_URL:(.*?)-->/)
            if (urlMatch) {
                // Example: https://.../storage/v1/object/public/product-files/files/abc.py
                // We need 'files/abc.py'
                const parts = urlMatch[1].split('/product-files/')
                if (parts.length > 1) {
                    filePath = decodeURIComponent(parts[1])
                }
            }
        }

        if (!filePath) {
            return NextResponse.json({ error: '다운로드할 파일이 연결되지 않았습니다.' }, { status: 404 })
        }

        // 4. Generate Signed URL (Valid for 60 seconds)
        const { data: signedData, error: signError } = await supabase
            .storage
            .from('product-files')
            .createSignedUrl(filePath, 60)

        if (signError) {
            console.error("Signed URL Error:", signError)
            return NextResponse.json({ error: '다운로드 링크 생성 실패' }, { status: 500 })
        }

        return NextResponse.json({ url: signedData.signedUrl })

    } catch (e) {
        console.error(e)
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
    }
}
