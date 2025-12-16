
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

        // 2. Check for Unlimited Stock (Common File)
        const video = purchase.videos
        const priceMatch = video.description?.match(/<!--PRICING:(.*?)-->/)
        const fileMatch = video.description?.match(/<!--FILE_URL:(.*?)-->/)
        const pathMatch = video.description?.match(/<!--FILE_PATH:(.*?)-->/)

        // Check if unlimited (high stock or file metadata present)
        const isUnlimited = (video.stock >= 99990) || !!fileMatch || !!pathMatch

        if (isUnlimited) {
            // [Unlimited Mode] Create new stock item on the fly
            let fileUrl = ""
            let filename = "download.zip" // default name

            if (fileMatch && fileMatch[1]) {
                fileUrl = fileMatch[1]
            } else if (pathMatch && pathMatch[1]) {
                // If stored as path, get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from("product-files") // Assuming 'product-files' bucket
                    .getPublicUrl(pathMatch[1])
                fileUrl = publicUrl
                filename = pathMatch[1].split('/').pop() || "download.zip"
            }

            if (!fileUrl) {
                return NextResponse.json({ error: "Configuration Error: Unlimited stock selected but no file URL found." }, { status: 500 })
            }

            // Insert new 'sold' stock item
            const { error: insertError } = await supabase
                .from("product_stock")
                .insert({
                    product_id: purchase.video_id,
                    content: "Unlimited Stock Item",
                    filename: filename,
                    file_url: fileUrl,
                    is_sold: true,
                    buyer_id: purchase.user_id,
                    sold_at: new Date().toISOString()
                })

            if (insertError) throw insertError

        } else {
            // [FIFO Mode] Find Oldest Available Stock
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

            // Update Stock (Mark as Sold)
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
