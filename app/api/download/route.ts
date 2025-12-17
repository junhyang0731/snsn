
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import archiver from "archiver"

// Service role needed to sign URLs for private bucket
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
    try {
        const { stockId } = await req.json()

        if (!stockId) {
            return NextResponse.json({ error: "Missing Stock ID" }, { status: 400 })
        }

        // 1. Fetch Stock Item with Video Info
        const { data: stock, error: stockError } = await supabaseAdmin
            .from('product_stock')
            .select('*, video:videos(*)')
            .eq('id', stockId)
            .single()

        if (stockError || !stock) {
            return NextResponse.json({ error: "File not found" }, { status: 404 })
        }

        // =========================================================
        // MODE A: On-Demand ZIP Generation (License Key Mode)
        // =========================================================
        if (stock.key_content) {
            const video = stock.video

            if (!video.base_file_path) {
                return NextResponse.json({ error: "Base file (Loader) is not configured for this product." }, { status: 500 })
            }

            // 1. Download Base File (Loader.exe)
            // Note: base_file_path should store the full path in storage, e.g. "distribution/vid/base_loader.exe"
            const { data: fileData, error: dlError } = await supabaseAdmin.storage
                .from('product-files')
                .download(video.base_file_path)

            if (dlError || !fileData) {
                console.error("Base file download error:", dlError)
                return NextResponse.json({ error: "Failed to load base file." }, { status: 500 })
            }

            const fileBuffer = Buffer.from(await fileData.arrayBuffer())

            // 2. Prepare Readme Content
            // Need Order ID (Purchase ID)
            const { data: purchase } = await supabaseAdmin.from('purchases')
                .select('id')
                .eq('user_id', stock.buyer_id)
                .eq('video_id', stock.product_id)
                .eq('status', 'completed')
                .order('created_at', { ascending: false }) // Get latest
                .limit(1)
                .single()

            const orderId = purchase?.id || "UNKNOWN"
            const originalFileName = video.base_file_path.split('/').pop()?.replace(/^base_/, '') || "Loader.exe"

            let readme = video.readme_template ||
                `Product: {product_name}
Key: {license_key}
Duration: {duration}
Order ID: {order_id}

Please input the key into the loader.`

            readme = readme.replace(/{product_name}/g, video.title || "Product")
            readme = readme.replace(/{license_key}/g, stock.key_content)
            readme = readme.replace(/{duration}/g, stock.duration || "Unknown")
            readme = readme.replace(/{order_id}/g, orderId)

            // 3. Create ZIP in Memory
            const archive = archiver('zip', { zlib: { level: 9 } })
            const buffers: Buffer[] = []

            await new Promise<void>((resolve, reject) => {
                archive.on('data', data => buffers.push(data))
                archive.on('end', () => resolve())
                archive.on('error', err => reject(err))

                // Append Files
                archive.append(fileBuffer, { name: originalFileName })
                archive.append(readme, { name: 'readme.txt' })

                archive.finalize()
            })

            const zipBuffer = Buffer.concat(buffers)

            // 4. Upload Temporary ZIP and Return Signed URL
            // Temp path: temp/{stock_id}_{timestamp}.zip
            // Recommended: Configure bucket lifecycle to delete 'temp/' folder every 24h
            const tempFileName = `temp/Delivery_${video.title.replace(/[^a-zA-Z0-9]/g, '_')}_${orderId.slice(0, 5)}.zip`

            const { error: uploadError } = await supabaseAdmin.storage
                .from('product-files')
                .upload(tempFileName, zipBuffer, {
                    contentType: 'application/zip',
                    upsert: true
                })

            if (uploadError) {
                console.error("Temp upload failed:", uploadError)
                return NextResponse.json({ error: "Failed to package file." }, { status: 500 })
            }

            // Generate Signed URL
            const { data: signData } = await supabaseAdmin.storage
                .from('product-files')
                .createSignedUrl(tempFileName, 3600) // 1 hour

            return NextResponse.json({ url: signData?.signedUrl })
        }

        // =========================================================
        // MODE B: Legacy File Mode (Stored ZIP)
        // =========================================================
        let path = ""
        if (stock.file_url && stock.file_url.includes("product-files/")) {
            path = stock.file_url.split("product-files/")[1]
        } else if (stock.filename) {
            // Fallback: Try to guess path or use stored filename if it contains path
            // Legacy path format: stocks/{id}/{file}
            // But we don't know the exact path if only filename is stored.
            // Hopefully file_url is present. If not, this might fail.
            // But for legacy items, file_url SHOULD be there.
            return NextResponse.json({ error: "Legacy file configuration error" }, { status: 500 })
        } else {
            return NextResponse.json({ error: "No file content found" }, { status: 404 })
        }

        path = decodeURIComponent(path)

        const { data, error } = await supabaseAdmin
            .storage
            .from('product-files')
            .createSignedUrl(path, 3600)

        if (error || !data?.signedUrl) {
            console.error("Sign Error:", error)
            return NextResponse.json({ error: "Failed to generate link" }, { status: 500 })
        }

        return NextResponse.json({ url: data.signedUrl })

    } catch (error: any) {
        console.error("Download Error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
