"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, AlertCircle, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface MyPurchase {
  id: string
  created_at: string
  status: string
  video: {
    title: string
    thumbnail_url: string
  } | null
  stock_item: {
    filename: string
    file_url: string
    license_key?: string
  } | null
}

export default function MyPurchasesPage() {
  const [purchases, setPurchases] = useState<MyPurchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchMyPurchases()
  }, [])

  const fetchMyPurchases = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Fetch Purchases
    const { data: purchaseData } = await supabase
      .from("purchases")
      .select("id, created_at, status, video:videos(title, thumbnail_url), video_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (!purchaseData) {
      setIsLoading(false)
      return
    }

    // 2. Fetch Assigned Stocks for these purchases
    // We find stocks where buyer_id = user.id AND product_id matches
    // Ideally we link by purchase_id, but we use product_id + time heuristic or just last item?
    // Actually, since we didn't store purchase_id in product_stock (mistake), we fetch ALL stocks for this user.
    // And manually map them? Or just list "Available Downloads".

    // Let's fetch all stocks owned by user
    const { data: stockData } = await supabase
      .from("product_stock")
      .select("*")
      .eq("buyer_id", user.id)

    // Map stocks to purchases?
    // Since we have N purchases of same item, and N stocks.
    // It's hard to map exactly 1:1 without unique ID.
    // Strategies:
    // A. Just show list of "Purchases" and simple "Status".
    //    And separate list of "My Files".
    // B. Try to map by product_id.

    const myFilesMap = new Map<string, any[]>() // product_id -> list of files
    stockData?.forEach(stock => {
      const list = myFilesMap.get(stock.product_id) || []
      list.push(stock)
      myFilesMap.set(stock.product_id, list)
    })

    const result = purchaseData.map((p: any) => {
      // If completed, try to pop a file from the map
      let assignedFile = null
      if (p.status === 'completed') {
        const files = myFilesMap.get(p.video_id)
        if (files && files.length > 0) {
          assignedFile = files.pop() // Take one
        }
      }
      return {
        ...p,
        stock_item: assignedFile
      }
    })

    setPurchases(result)
    setIsLoading(false)
  }

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">내 구매 내역</h1>

        {purchases.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-xl">
            <p className="text-muted-foreground mb-4">구매 내역이 없습니다.</p>
            <Link href="/">
              <Button>상품 둘러보기</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {purchases.map(purchase => (
              <Card key={purchase.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="w-full md:w-48 h-32 bg-muted relative">
                      {purchase.video?.thumbnail_url && (
                        <img
                          src={purchase.video.thumbnail_url}
                          alt={purchase.video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{purchase.video?.title || "삭제된 상품"}</h3>
                          <p className="text-sm text-muted-foreground">
                            구매일: {new Date(purchase.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          purchase.status === 'completed' ? 'default' :
                            purchase.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {purchase.status === 'completed' ? '구매 완료' :
                            purchase.status === 'rejected' ? '거절됨' : '입금 확인 중'}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        {purchase.status === 'completed' ? (
                          purchase.stock_item ? (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-green-700">
                                <CheckCircle2 size={18} />
                                <span className="font-medium text-sm">상품이 준비되었습니다.</span>
                                <span className="text-xs opacity-70">({purchase.stock_item.filename})</span>
                              </div>
                              <a href={purchase.stock_item.file_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" className="gap-2">
                                  <Download size={16} /> 다운로드
                                </Button>
                              </a>
                            </div>
                          ) : (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-2 text-yellow-700">
                              <AlertCircle size={18} />
                              <span className="text-sm">관리자가 승인했지만 파일이 할당되지 않았습니다. 문의해주세요.</span>
                            </div>
                          )
                        ) : (
                          <div className="bg-muted rounded-lg p-3 flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock size={16} />
                            <span>입금을 확인하고 있습니다. 승인되면 여기에 다운로드 버튼이 나타납니다.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
