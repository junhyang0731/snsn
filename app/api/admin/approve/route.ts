
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Service Role Client for Admin Operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
    try {
        const { purchaseId, userId } = await req.json()

        if (!purchaseId) {
            return NextResponse.json({ error: "Purchase ID is required" }, { status: 400 })
        }

        // 1. Get Purchase Info
        const { data: purchase, error: purchaseError } = await supabase
            .from("purchases")
            .select("*, videos(*)")
            .eq("id", purchaseId)
            .single()

        if (purchaseError || !purchase) {
            return NextResponse.json({ error: "Purchase not found" }, { status: 404 })
        }

        if (purchase.status === 'completed') {
            return NextResponse.json({ message: "Already completed" })
        }

        // 2. FIFO Logic: Find Oldest Available Stock
        const { data: stockItem, error: stockError } = await supabase
            .from("product_stock")
            .select("*")
            .eq("product_id", purchase.video_id)
            .eq("is_sold", false)
            .order("created_at", { ascending: true }) // FIFO
            .limit(1)
            .single()

        if (stockError || !stockItem) {
            return NextResponse.json({ error: "재고가 부족하여 승인할 수 없습니다." }, { status: 409 })
        }

        // 3. Update Stock (Mark as Sold)
        const { error: updateStockError } = await supabase
            .from("product_stock")
            .update({
                is_sold: true,
                buyer_id: purchase.user_id, // Use actual buyer ID
                sold_at: new Date().toISOString()
            })
            .eq("id", stockItem.id)

        if (updateStockError) {
            throw updateStockError
        }

        // 4. Update Purchase Status
        await supabase
            .from("purchases")
            .update({ status: "completed" })
            .eq("id", purchaseId)

        // 5. Decrement Display Stock (Optional / Visual)
        await supabase.rpc("decrement_stock", { video_uuid: purchase.video_id })

        return NextResponse.json({ success: true, message: "Purchase approved and file assigned." })

    } catch (error: any) {
        console.error("Approval Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
