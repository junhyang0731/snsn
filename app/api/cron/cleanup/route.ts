
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
    try {
        // 1. Find Expired Stocks (Sold > 72 hours ago)
        // Exclude 'Unlimited Stock Item' (Common Files)
        const cutoffDate = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

        const { data: expiredStocks, error } = await supabaseAdmin
            .from("product_stock")
            .select("*")
            .eq("is_sold", true)
            .lt("sold_at", cutoffDate)
            .neq("content", "Unlimited Stock Item") // IMPORTANT: Don't delete common files

        if (error) throw error
        if (!expiredStocks || expiredStocks.length === 0) {
            return NextResponse.json({ message: "No expired files to clean up." })
        }

        let deletedCount = 0
        const errors = []

        for (const stock of expiredStocks) {
            // 2. Delete from Storage
            try {
                let path = ""
                if (stock.file_url.includes("product-files/")) {
                    path = stock.file_url.split("product-files/")[1]
                } else {
                    path = stock.filename
                }
                path = decodeURIComponent(path)

                const { error: storageError } = await supabaseAdmin.storage
                    .from("product-files")
                    .remove([path])

                if (storageError) {
                    console.error(`Storage delete failed for ${stock.id}:`, storageError)
                    // We continue to delete DB record? No, keep it sync or just log.
                    // Usually safe to delete DB even if storage fails (orphan file), but let's try strict.
                }

                // 3. Delete from DB
                await supabaseAdmin.from("product_stock").delete().eq("id", stock.id)

                deletedCount++
            } catch (e: any) {
                errors.push({ id: stock.id, error: e.message })
            }
        }

        return NextResponse.json({
            success: true,
            deleted: deletedCount,
            errors: errors
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
