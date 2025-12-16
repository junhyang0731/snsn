"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Trash2, Plus, Upload, FileText, CreditCard, Edit, Pencil, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import AdminChatTab from "@/components/admin-chat-tab"
import AdminStockTab from "@/components/admin-stock-tab"
import AdminPatchNotesTab from "@/components/admin-patch-notes-tab"

interface Video {
  id: string
  title: string
  description: string
  price: number
  thumbnail_url: string
  created_at: string
  stock?: number
  game_name?: string
}

interface Purchase {
  id: string
  user_id: string
  video_id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  user_email?: string
  video_title?: string
  stock_quantity_at_purchase?: number
}

interface Review {
  id: string
  nickname: string
  content: string
  rating: number
  created_at: string
}

interface Notice {
  id: string
  title: string
  content: string
  is_popup: boolean
  image_url?: string
  created_at: string
}

export default function AdminPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [notices, setNotices] = useState<Notice[]>([])

  const [searchTerm, setSearchTerm] = useState("")
  const [title, setTitle] = useState("")
  const [gameName, setGameName] = useState("Valorant")

  // Notice Form
  const [noticeTitle, setNoticeTitle] = useState("")
  const [noticeContent, setNoticeContent] = useState("")
  const [isNoticePopup, setIsNoticePopup] = useState(false)
  const [noticeImageUrl, setNoticeImageUrl] = useState("")
  const [pricingTiers, setPricingTiers] = useState<Record<string, string>>({})
  const [stock, setStock] = useState("999")
  const [description, setDescription] = useState("")
  const [thumbnailUrl, setThumbnailUrl] = useState("")
  const [productFileUrl, setProductFileUrl] = useState("")
  const [productFilePath, setProductFilePath] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isFileUploading, setIsFileUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const handlePriceChange = (duration: string, value: string) => {
    setPricingTiers(prev => ({ ...prev, [duration]: value }))
  }

  const handleProductFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsFileUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `files/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("product-files")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("product-files")
        .getPublicUrl(filePath)

      setProductFileUrl(publicUrl)
      setProductFilePath(filePath)
    } catch (error: any) {
      console.error(error)
      setError(`파일 업로드 실패: ${error.message || JSON.stringify(error)}`)
    } finally {
      setIsFileUploading(false)
    }
  }

  const handleNoticeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setIsUploading(true)
      const fileExt = file.name.split(".").pop()
      const fileName = `notice-${Date.now()}.${fileExt}`
      const filePath = `notices/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath)

      setNoticeImageUrl(publicUrl)
    } catch (error: any) {
      console.error(error)
      alert("이미지 업로드 실패")
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `thumbnails/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath)

      setThumbnailUrl(publicUrl)
    } catch (error: any) {
      console.error(error)
      setError(`이미지 업로드 실패: ${error.message || JSON.stringify(error)}`)
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

        if (!profile?.is_admin) {
          router.push("/dashboard")
          return
        }

        const { data: videosData } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false })

        // 1. Fetch raw purchases
        const { data: rawPurchases, error: purchaseError } = await supabase
          .from("purchases")
          .select("*")
          .order("created_at", { ascending: false })

        if (purchaseError) throw purchaseError

        let mappedPurchases: Purchase[] = []

        if (rawPurchases && rawPurchases.length > 0) {
          // 2. Extract IDs for manual join
          const userIds = Array.from(new Set(rawPurchases.map((p) => p.user_id)))

          // 3. Fetch profiles
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, email")
            .in("id", userIds)

          const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
            acc[profile.id] = profile
            return acc
          }, {})

          const videosMap = (videosData || []).reduce((acc: any, video: any) => {
            acc[video.id] = video
            return acc
          }, {})

          // 4. Map data
          mappedPurchases = rawPurchases.map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            video_id: p.video_id,
            amount: p.amount,
            payment_method: p.payment_method,
            status: p.status,
            created_at: p.created_at,
            user_email: profilesMap[p.user_id]?.email || "알 수 없음 (삭제됨?)",
            video_title: videosMap[p.video_id]?.title || "삭제된 상품",
            stock_quantity_at_purchase: p.stock_quantity_at_purchase
          }))
        }

        const { data: reviewsData } = await supabase.from("reviews").select("*").order("created_at", { ascending: false })
        const { data: noticesData } = await supabase.from("notices").select("*").order("created_at", { ascending: false })

        setVideos(videosData || [])
        setPurchases(mappedPurchases)
        setReviews(reviewsData || [])
        setNotices(noticesData || [])
      } catch (error: any) {
        console.error("데이터 로드 실패:", error)
        setError("데이터를 불러오는 중 오류가 발생했습니다: " + (error.message || JSON.stringify(error)))
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase])

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const basePrice = Number.parseFloat(pricingTiers["1일"] || "0")
    const stockCount = Number.parseInt(stock)

    if (!title || !description || !thumbnailUrl || basePrice === 0) {
      setError("모든 필드와 1일 가격은 필수입니다")
      setIsSubmitting(false)
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("사용자를 찾을 수 없습니다")

      const pricingMetadata = JSON.stringify(pricingTiers)
      const fileMetadata = productFilePath
        ? `<!--FILE_PATH:${productFilePath}-->`
        : (productFileUrl ? `<!--FILE_URL:${productFileUrl}-->` : "")
      const fullDescription = `${description}\n\n<!--PRICING:${pricingMetadata}-->${fileMetadata}`

      const videoData = {
        title,
        description: fullDescription,
        price: basePrice,
        thumbnail_url: thumbnailUrl,
        user_id: user.id,
        is_admin: true,
        stock: stockCount,
        game_name: gameName,
      }

      if (editingVideoId) {
        const { error: updateError } = await supabase
          .from("videos")
          .update(videoData)
          .eq("id", editingVideoId)

        if (updateError) throw updateError

        setVideos(videos.map(v => v.id === editingVideoId ? { ...v, ...videoData, id: editingVideoId, created_at: v.created_at } : v))
      } else {
        const { data, error: insertError } = await supabase
          .from("videos")
          .insert(videoData)
          .select()

        if (insertError) throw insertError
        setVideos([data[0], ...videos])
      }

      setTitle("")
      setGameName("Valorant")
      setDescription("")
      setPricingTiers({})
      setStock("999")
      setThumbnailUrl("")
      setProductFileUrl("")
      setProductFilePath("")
      setEditingVideoId(null)
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error(error)
      const detail = error?.message || error?.error_description || JSON.stringify(error)
      alert(`상세 오류 내용: ${detail}`)
    } finally {
      setIsSubmitting(false)
      setProductFilePath("") // Reset file path after save attempt
    }
  }

  const handleRestock = async (videoId: string, currentStock: number) => {
    const addStockStr = prompt(`현재 재고: ${currentStock}개\n추가 입고할 수량을 입력하세요:`, "0")
    if (addStockStr === null) return

    const addStock = parseInt(addStockStr)
    if (isNaN(addStock) || addStock <= 0) {
      alert("유효한 수량을 입력하세요")
      return
    }

    const newTotal = currentStock + addStock

    try {
      const { error } = await supabase.from("videos").update({ stock: newTotal }).eq("id", videoId)
      if (error) throw error

      setVideos(videos.map(v => v.id === videoId ? { ...v, stock: newTotal } : v))
      alert(`재고가 업데이트되었습니다.\n(기존: ${currentStock} + 입고: ${addStock} = 총: ${newTotal}개)`)
    } catch (e) {
      alert("재고 입고 실패")
    }
  }

  const handleEditClick = (video: Video) => {
    setEditingVideoId(video.id)
    setTitle(video.title)
    setStock(video.stock?.toString() || "999")
    setGameName(video.game_name || "Valorant")
    setThumbnailUrl(video.thumbnail_url)

    // Parse Description for Pricing and File URL
    const priceMatch = video.description.match(/<!--PRICING:(.*?)-->/)
    const fileMatch = video.description.match(/<!--FILE_URL:(.*?)-->/)
    const pathMatch = video.description.match(/<!--FILE_PATH:(.*?)-->/)

    let cleanDesc = video.description
    if (priceMatch && priceMatch[1]) {
      cleanDesc = cleanDesc.replace(priceMatch[0], "")
      try {
        setPricingTiers(JSON.parse(priceMatch[1]))
      } catch (e) { console.error(e) }
    } else {
      setPricingTiers({})
    }

    if (pathMatch && pathMatch[1]) {
      cleanDesc = cleanDesc.replace(pathMatch[0], "")
      setProductFilePath(pathMatch[1])
      setProductFileUrl("") // Don't show confusing public URL if using path
    } else if (fileMatch && fileMatch[1]) {
      cleanDesc = cleanDesc.replace(fileMatch[0], "")
      setProductFileUrl(fileMatch[1])
      setProductFilePath("")
    } else {
      setProductFileUrl("")
      setProductFilePath("")
    }

    setDescription(cleanDesc.trim())
    setIsDialogOpen(true)
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("이 치트를 삭제하시겠습니까?")) return

    try {
      const { error } = await supabase.from("videos").delete().eq("id", videoId)

      if (error) throw error
      setVideos(videos.filter((v) => v.id !== videoId))
    } catch (error) {
      setError(error instanceof Error ? error.message : "삭제에 실패했습니다")
    }
  }

  const handleConfirmPayment = async (purchaseId: string) => {
    if (!confirm("이 구매를 승인하시겠습니까? (재고가 자동으로 할당됩니다)")) return

    try {
      const response = await fetch("/api/admin/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "승인 실패")
      }

      setPurchases(purchases.map(p => p.id === purchaseId ? { ...p, status: "completed" } : p))
      alert("구매가 승인되고 파일이 할당되었습니다.")
    } catch (error: any) {
      alert(`오류: ${error.message}`)
      // setError(error.message) // Optional
    }
  }

  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noticeTitle || !noticeContent) {
      alert("제목과 내용은 필수입니다.")
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from("notices").insert({
        title: noticeTitle,
        content: noticeContent,
        is_popup: isNoticePopup,
        image_url: noticeImageUrl,
        user_id: user?.id
      }).select().single()

      if (error) throw error
      setNotices([data, ...notices])
      setNoticeTitle("")
      setNoticeContent("")
      setIsNoticePopup(false)
      setNoticeImageUrl("")
      alert("공지가 등록되었습니다.")
    } catch (e) {
      console.error(e)
      alert("공지 등록 실패")
    }
  }

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    await supabase.from("notices").delete().eq("id", id)
    setNotices(notices.filter(n => n.id !== id))
  }

  const handleDeleteReview = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return
    await supabase.from("reviews").delete().eq("id", id)
    setReviews(reviews.filter(r => r.id !== id))
  }

  const handleRejectPayment = async (purchaseId: string) => {
    if (!confirm("이 구매를 거절하시겠습니까?")) return

    try {
      const { error } = await supabase
        .from("purchases")
        .update({ status: "rejected" })
        .eq("id", purchaseId)

      if (error) throw error

      setPurchases(purchases.map(p => p.id === purchaseId ? { ...p, status: "rejected" } : p))
    } catch (error) {
      setError("거절 처리에 실패했습니다")
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    if (method.startsWith("bank_transfer")) {
      const parts = method.split(":")
      if (parts.length > 2) {
        return (
          <div className="flex flex-col">
            <span>무통장입금</span>
            <span className="text-xs text-muted-foreground">{parts[1]} (예금주: {parts[2]})</span>
          </div>
        )
      }
      return "무통장입금 (정보 없음)"
    }
    switch (method) {
      case "bank_transfer":
        return "무통장입금"
      case "bitcoin":
        return "비트코인"
      case "litecoin":
        return "라이트코인"
      default:
        return method
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-700 text-sm">완료</span>
      case "pending":
        return <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-700 text-sm">대기 중</span>
      case "rejected":
        return <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-700 text-sm">거절됨</span>
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-500/20 text-gray-700 text-sm">{status}</span>
    }
  }

  if (isLoading) return <div className="text-center py-12">로딩 중...</div>

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">어드민 대시보드</h1>
        </div>

        {error && (
          <Card className="mb-6 border-red-500/50 bg-red-500/5">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="videos">치트 관리</TabsTrigger>
            <TabsTrigger value="stock">재고 관리 (파일)</TabsTrigger>
            <TabsTrigger value="purchases">구매 내역</TabsTrigger>
            <TabsTrigger value="notices">공지 및 팝업</TabsTrigger>
            <TabsTrigger value="reviews">리뷰 관리</TabsTrigger>
            <TabsTrigger value="chat">1:1 답변</TabsTrigger>
          </TabsList>

          <TabsContent value="stock">
            <AdminStockTab />
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden group relative">
                  <div className="aspect-video relative overflow-hidden bg-muted/20">
                    <img
                      src={video.thumbnail_url || "/placeholder.svg"}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="secondary" size="icon" onClick={() => handleEditClick(video)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteVideo(video.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{video.description.split("<!--")[0]}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-bold text-primary">₩{video.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{new Date(video.created_at).toLocaleDateString()}</span>
                    </div>
                    {video.stock !== undefined && (
                      <div className="mt-1 text-xs text-muted-foreground flex items-center justify-between">
                        <span>재고: {video.stock >= 999 ? "무제한" : `${video.stock}개`}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRestock(video.id, video.stock || 0)} title="재고 입고">
                          <Plus size={12} />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Add New Card */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Card className="flex flex-col items-center justify-center p-6 border-dashed border-2 cursor-pointer hover:border-primary hover:bg-muted/10 transition-colors h-full min-h-[300px]">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                      <Plus size={24} />
                    </div>
                    <h3 className="text-lg font-semibold">새 치트 추가</h3>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      클릭하여 새로운 발로란트 치트 상품을 등록하세요
                    </p>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingVideoId ? "치트 수정" : "새 치트 등록"}</DialogTitle>
                    <DialogDescription>
                      {editingVideoId ? "기존 상품 정보를 수정합니다." : "상품 정보, 가격, 이미지 및 파일을 업로드하세요."}
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSaveVideo} className="space-y-6 mt-4">
                    <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                      <Label htmlFor="thumbnail" className="flex items-center gap-2">
                        <Upload size={16} /> 썸네일 이미지
                      </Label>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Input
                            id="thumbnail"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                          />
                        </div>
                        {isUploading && <span className="text-sm text-muted-foreground pb-2">업로드 중...</span>}
                      </div>
                      {thumbnailUrl && (
                        <div className="mt-2 relative w-full h-40 bg-background rounded-md overflow-hidden border">
                          <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="game_name">게임 이름 (카테고리)</Label>
                        <Input
                          id="game_name"
                          value={gameName}
                          onChange={(e) => setGameName(e.target.value)}
                          placeholder="예: Valorant, Roblox - Blox Fruits"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">치트명</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="예: 발로란트 ESP & 월핵"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">설명</Label>
                        <Input
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="상품에 대한 상세 설명을 입력하세요"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                      <Label htmlFor="stock">재고 수량</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="999"
                        required
                      />
                      <p className="text-xs text-muted-foreground">999 이상 입력 시 사실상 무제한으로 간주됩니다.</p>
                    </div>

                    <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                      <Label className="flex items-center gap-2">
                        <CreditCard size={16} /> 가격 설정 (단위: 원)
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {["1일", "3일", "7일", "10일", "15일", "30일", "영구제"].map((duration) => (
                          <div key={duration} className="space-y-2">
                            <Label htmlFor={`price-${duration}`} className="text-xs text-muted-foreground">{duration}</Label>
                            <Input
                              id={`price-${duration}`}
                              type="number"
                              placeholder="0"
                              value={pricingTiers[duration] || ""}
                              onChange={(e) => handlePriceChange(duration, e.target.value)}
                              className="text-right"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                      <Label htmlFor="product-file" className="flex items-center gap-2">
                        <FileText size={16} /> 제품 파일 (다운로드용)
                      </Label>
                      <div className="flex gap-4 items-end">
                        <div className="flex-1">
                          <Input
                            id="product-file"
                            type="file"
                            onChange={handleProductFileUpload}
                            disabled={isFileUploading}
                          />
                        </div>
                        {isFileUploading && <span className="text-sm text-muted-foreground pb-2">업로드 중...</span>}
                      </div>
                      {productFileUrl && (
                        <p className="text-sm text-green-600 mt-2 break-all bg-green-500/10 p-2 rounded">
                          ✅ 파일 준비 완료
                        </p>
                      )}
                    </div>

                    <Button type="submit" disabled={isSubmitting || isUploading || isFileUploading} className="w-full">
                      {isSubmitting ? "등록 중..." : "치트 등록하기"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>구매 내역</CardTitle>
                <CardDescription>고객의 구매 정보 및 결제 현황을 확인하세요</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Input
                    placeholder="검색: 이메일 또는 예금주명..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                {purchases.length === 0 ? (
                  <p className="text-muted-foreground">구매 내역이 없습니다</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">고객 이메일</th>
                          <th className="text-left py-3 px-4">치트명</th>
                          <th className="text-left py-3 px-4">결제 방법</th>
                          <th className="text-left py-3 px-4">구매 시 재고</th>
                          <th className="text-left py-3 px-4">금액</th>
                          <th className="text-left py-3 px-4">상태</th>
                          <th className="text-left py-3 px-4">구매 일시</th>
                          <th className="text-left py-3 px-4">관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases
                          .filter((purchase) => {
                            const searchLower = searchTerm.toLowerCase()
                            const emailMatch = purchase.user_email?.toLowerCase().includes(searchLower)
                            const paymentLabel = typeof getPaymentMethodLabel(purchase.payment_method) === 'string'
                              ? (getPaymentMethodLabel(purchase.payment_method) as string).toLowerCase()
                              : purchase.payment_method.toLowerCase()
                            const paymentMatch = paymentLabel.includes(searchLower)
                            const rawMethodMatch = purchase.payment_method.toLowerCase().includes(searchLower)
                            return emailMatch || paymentMatch || rawMethodMatch
                          })
                          .map((purchase) => (
                            <tr key={purchase.id} className="border-b hover:bg-secondary/50">
                              <td className="py-3 px-4 font-mono text-xs">{purchase.user_email}</td>
                              <td className="py-3 px-4">{purchase.video_title}</td>
                              <td className="py-3 px-4">{getPaymentMethodLabel(purchase.payment_method)}</td>
                              <td className="py-3 px-4 text-xs">{purchase.stock_quantity_at_purchase !== undefined ? `${purchase.stock_quantity_at_purchase}개` : "-"}</td>
                              <td className="py-3 px-4 font-semibold">₩{purchase.amount.toLocaleString()}</td>
                              <td className="py-3 px-4">{getStatusBadge(purchase.status)}</td>
                              <td className="py-3 px-4 text-muted-foreground">
                                {new Date(purchase.created_at).toLocaleDateString("ko-KR")}
                              </td>
                              <td className="py-3 px-4">
                                {purchase.status === "pending" && (
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleConfirmPayment(purchase.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                      승인
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleRejectPayment(purchase.id)}>
                                      거절
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>공지 등록</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleAddNotice} className="space-y-4">
                    <div>
                      <Label>제목</Label>
                      <Input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} />
                    </div>
                    <div>
                      <Label>내용</Label>
                      <Input value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)} />
                    </div>
                    <div>
                      <Label>이미지 (선택)</Label>
                      <div className="space-y-2">
                        <Input type="file" onChange={handleNoticeImageUpload} className="cursor-pointer" accept="image/*" />
                        <Input value={noticeImageUrl} onChange={(e) => setNoticeImageUrl(e.target.value)} placeholder="이미지 URL 직접 입력 가능" />
                      </div>
                      {noticeImageUrl && (
                        <div className="mt-2 text-xs text-green-600">이미지가 설정되었습니다.</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="popup" checked={isNoticePopup} onChange={(e) => setIsNoticePopup(e.target.checked)} />
                      <Label htmlFor="popup">메인 팝업으로 설정</Label>
                    </div>
                    <Button type="submit">등록</Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>공지 목록</CardTitle></CardHeader>
                <CardContent>
                  <div className="max-h-[500px] overflow-y-auto">
                    <ul className="space-y-2">
                      {notices.map(notice => (
                        <li key={notice.id} className="flex justify-between items-center border p-2 rounded">
                          <div>
                            <div className="font-bold">{notice.title} {notice.is_popup && <span className="text-red-500 text-xs">(팝업)</span>}</div>
                            <div className="text-xs text-muted-foreground">{new Date(notice.created_at).toLocaleDateString()}</div>
                          </div>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteNotice(notice.id)}>삭제</Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>리뷰 관리</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">닉네임</th>
                        <th className="text-left py-2 px-2">내용</th>
                        <th className="text-left py-2 px-2">별점</th>
                        <th className="text-left py-2 px-2">작성일</th>
                        <th className="text-left py-2 px-2">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map(review => (
                        <tr key={review.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-2">{review.nickname}</td>
                          <td className="py-2 px-2 max-w-[300px] truncate">{review.content}</td>
                          <td className="py-2 px-2">{review.rating}</td>
                          <td className="py-2 px-2">{new Date(review.created_at).toLocaleDateString()}</td>
                          <td className="py-2 px-2">
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(review.id)}>삭제</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>1:1 문의 관리</CardTitle>
                <CardDescription>고객과 실시간으로 대화하세요.</CardDescription>
              </CardHeader>
              <CardContent>
                <AdminChatTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
