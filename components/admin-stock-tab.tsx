"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Trash2, FileArchive, RefreshCw, Archive, Key, Plus } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Video {
    id: string
    title: string
    stock: number
    thumbnail_url: string
}

interface ProductStock {
    id: string
    filename?: string
    file_url?: string
    key_content?: string
    duration?: string // e.g., "1일", "30일"
    created_at: string
    is_sold: boolean
}

export default function AdminStockTab() {
    const [videos, setVideos] = useState<Video[]>([])
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
    const [stocks, setStocks] = useState<ProductStock[]>([])

    // File Upload States
    const [isUploading, setIsUploading] = useState(false)

    // Key Upload States
    const [isKeyDialogOpen, setIsKeyDialogOpen] = useState(false)
    const [keysInput, setKeysInput] = useState("")
    const [keyDuration, setKeyDuration] = useState("1일")
    const [isKeySubmitting, setIsKeySubmitting] = useState(false)

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

                const { error: dbError } = await supabase.from("product_stock").insert({
                    product_id: selectedVideo.id,
                    filename: file.name,
                    file_url: publicUrl,
                    is_sold: false,
                    duration: '파일(공용)' // Or null if strictly file
                })

                if (dbError) {
                    console.error("DB insert failed for", file.name, dbError)
                    continue
                }
                successCount++
            }

            alert(`${files.length}개 중 ${successCount}개 파일 등록 성공!`)
            await updateStockCount(selectedVideo.id)
            fetchStockDetail(selectedVideo.id)
            fetchVideos()

        } catch (e) {
            console.error(e)
            alert("업로드 중 오류가 발생했습니다.")
        } finally {
            setIsUploading(false)
            e.target.value = ""
        }
    }

    const handleKeySubmit = async () => {
        if (!selectedVideo || !keysInput.trim()) return

        setIsKeySubmitting(true)
        const keys = keysInput.split('\n').map(k => k.trim()).filter(k => k.length > 0)

        try {
            const insertData = keys.map(key => ({
                product_id: selectedVideo.id,
                key_content: key,
                duration: keyDuration,
                is_sold: false,
                content: "License Key" // Legacy field support
            }))

            const { error } = await supabase.from("product_stock").insert(insertData)

            if (error) throw error

            alert(`${keys.length}개의 키가 등록되었습니다 (${keyDuration}).`)
            setKeysInput("")
            setIsKeyDialogOpen(false)

            await updateStockCount(selectedVideo.id)
            fetchStockDetail(selectedVideo.id)
            fetchVideos()

        } catch (e: any) {
            console.error(e)
            alert(`등록 실패: ${e.message}`)
        } finally {
            setIsKeySubmitting(false)
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
        if (!selectedVideo || !confirm("이 재고를 삭제하시겠습니까?")) return

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
                                {/* Key Registration Dialog */}
                                <Dialog open={isKeyDialogOpen} onOpenChange={setIsKeyDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="gap-2">
                                            <Key size={16} />
                                            키 일괄 등록
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>라이선스 키 등록</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>이 이용권의 기간은?</Label>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={keyDuration}
                                                    onChange={(e) => setKeyDuration(e.target.value)}
                                                >
                                                    <option value="1일">1일</option>
                                                    <option value="3일">3일</option>
                                                    <option value="7일">7일</option>
                                                    <option value="10일">10일</option>
                                                    <option value="15일">15일</option>
                                                    <option value="30일">30일</option>
                                                    <option value="영구제">영구제</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>키 입력 (한 줄에 하나씩)</Label>
                                                <Textarea
                                                    value={keysInput}
                                                    onChange={(e) => setKeysInput(e.target.value)}
                                                    placeholder="XXXX-XXXX-XXXX-XXXX&#13;&#10;YYYY-YYYY-YYYY-YYYY"
                                                    rows={10}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    총 {keysInput.split('\n').filter(k => k.trim()).length}개의 키가 감지됨
                                                </p>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleKeySubmit} disabled={isKeySubmitting}>
                                                {isKeySubmitting ? "등록 중..." : "등록하기"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {/* File Upload */}
                                <Label htmlFor="stock-upload" className={`cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ${isUploading ? 'opacity-50' : ''}`}>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {isUploading ? "업로드 중..." : "ZIP 파일 등록"}
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
                                    등록된 재고가 없습니다.<br />
                                    우측 상단의 버튼을 눌러 파일이나 키를 등록해주세요.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {stocks.map(stock => (
                                        <div key={stock.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg hover:bg-secondary/40 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className={`p-2 rounded ${stock.key_content ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {stock.key_content ? <Key size={18} /> : <FileArchive size={18} />}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-sm truncate">
                                                        {stock.key_content ? `[KEY] ${stock.key_content}` : stock.filename}
                                                    </span>
                                                    <div className="flex gap-2 text-xs text-muted-foreground">
                                                        {stock.duration && <span className="font-bold text-primary">{stock.duration}</span>}
                                                        <span>{new Date(stock.created_at).toLocaleString()}</span>
                                                    </div>
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
