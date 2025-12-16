"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Trash2, FileArchive, RefreshCw, Archive } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Video {
    id: string
    title: string
    stock: number
    thumbnail_url: string
}

interface ProductStock {
    id: string
    filename: string
    created_at: string
    is_sold: boolean
}

export default function AdminStockTab() {
    const [videos, setVideos] = useState<Video[]>([])
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
    const [stocks, setStocks] = useState<ProductStock[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchVideos()
    }, [])

    const fetchVideos = async () => {
        const { data } = await supabase.from("videos").select("id, title, stock, thumbnail_url").order("created_at", { ascending: false })
        if (data) setVideos(data)
    }

    const fetchStockDetail = async (videoId: string) => {
        setIsLoading(true)
        const { data } = await supabase
            .from("product_stock")
            .select("*")
            .eq("product_id", videoId)
            .eq("is_sold", false)
            .order("created_at", { ascending: false })

        if (data) setStocks(data)
        setIsLoading(false)
    }

    const handleVideoSelect = (video: Video) => {
        setSelectedVideo(video)
        fetchStockDetail(video.id)
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedVideo || !e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        const files = Array.from(e.target.files)
        let successCount = 0

        try {
            for (const file of files) {
                // 1. Upload to Storage
                // Use a safe folder structure: stocks/{product_id}/{timestamp}_{filename}
                // But filename must be unique.
                const safeName = file.name.replace(/[^a-zA-Z0-9-_\.]/g, '_')
                const path = `stocks/${selectedVideo.id}/${Date.now()}_${safeName}`

                const { error: uploadError } = await supabase.storage
                    .from("product-files")
                    .upload(path, file)

                if (uploadError) {
                    console.error("Upload failed for", file.name, uploadError)
                    continue
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("product-files")
                    .getPublicUrl(path)

                // 2. Insert into product_stock
                const { error: dbError } = await supabase.from("product_stock").insert({
                    product_id: selectedVideo.id,
                    filename: file.name,
                    file_url: publicUrl,
                    is_sold: false
                })

                if (dbError) {
                    console.error("DB insert failed for", file.name, dbError)
                    continue
                }
                successCount++
            }

            alert(`${files.length}개 중 ${successCount}개 파일 등록 성공!`)

            // 3. Update Video Stock Count
            // We recount total stock
            await updateStockCount(selectedVideo.id)

            // Refresh view
            fetchStockDetail(selectedVideo.id)
            fetchVideos() // Update main list counts

        } catch (e) {
            console.error(e)
            alert("업로드 중 오류가 발생했습니다.")
        } finally {
            setIsUploading(false)
            // Clear input
            e.target.value = ""
        }
    }

    const updateStockCount = async (videoId: string) => {
        const { count } = await supabase
            .from("product_stock")
            .select("*", { count: 'exact', head: true })
            .eq("product_id", videoId)
            .eq("is_sold", false)

        if (count !== null) {
            await supabase.from("videos").update({ stock: count }).eq("id", videoId)
        }
    }

    const handleDeleteStock = async (stockId: string) => {
        if (!selectedVideo || !confirm("이 재고 파일을 삭제하시겠습니까?")) return

        await supabase.from("product_stock").delete().eq("id", stockId)
        await updateStockCount(selectedVideo.id)

        fetchStockDetail(selectedVideo.id)
        fetchVideos()
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {videos.map(video => (
                    <Card
                        key={video.id}
                        className={`cursor-pointer transition-all hover:border-primary ${selectedVideo?.id === video.id ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => handleVideoSelect(video)}
                    >
                        <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-base font-medium truncate pr-2">{video.title}</CardTitle>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${video.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {video.stock}개
                            </span>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                            클릭하여 재고 관리
                        </CardContent>
                    </Card>
                ))}
            </div>

            {selectedVideo && (
                <Card className="border-t-4 border-t-primary animate-in slide-in-from-bottom-2">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>📦 {selectedVideo.title} - 재고 관리</span>
                            <div className="flex gap-2">
                                <Label htmlFor="stock-upload" className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${isUploading ? 'opacity-50' : ''}`}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isUploading ? "업로드 중..." : "ZIP 파일 일괄 추가"}
                                </Label>
                                <Input
                                    id="stock-upload"
                                    type="file"
                                    multiple
                                    accept=".zip,.rar,.7z"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                            {isLoading ? (
                                <div className="text-center py-10">로딩 중...</div>
                            ) : stocks.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    등록된 재고 파일이 없습니다.<br />
                                    우측 상단의 버튼을 눌러 파일을 등록해주세요.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {stocks.map(stock => (
                                        <div key={stock.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-orange-100 p-2 rounded text-orange-600">
                                                    <FileArchive size={18} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-sm truncate">{stock.filename}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(stock.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={() => handleDeleteStock(stock.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
