"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Link from "next/link"

interface Purchase {
  id: string
  video_id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  video: {
    title: string
    thumbnail_url: string
    description: string
  }
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data, error } = await supabase
          .from("purchases")
          .select("*, video:videos(title, thumbnail_url, description)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error
        setPurchases(data || [])
      } catch (error) {
        console.error("구매 이력 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPurchases()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>로딩 중...</p>
        </main>
        <Footer />
      </div>
    )
  }

  const handleSecureDownload = async (purchaseId: string, filename: string) => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '다운로드 실패')
      }

      const link = document.createElement('a')
      link.href = data.url
      link.download = filename || 'download.py'
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      alert(error instanceof Error ? error.message : "다운로드 중 오류가 발생했습니다")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">구매 이력</h1>
            <p className="text-muted-foreground">구매한 치트 목록입니다</p>
          </div>

          {purchases.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">구매한 치트가 없습니다</p>
                  <Link href="/">
                    <Button>쇼핑하러 가기</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Card key={purchase.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <img
                        src={(purchase.video as any)?.thumbnail_url || "/placeholder.svg"}
                        alt={(purchase.video as any)?.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-2">{(purchase.video as any)?.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="font-bold text-primary">₩{purchase.amount.toLocaleString()}</span>
                          <span>
                            {purchase.payment_method?.startsWith("bank_transfer")
                              ? "무통장입금"
                              : purchase.payment_method === "bitcoin"
                                ? "비트코인"
                                : "코인"}
                          </span>
                          <span>{new Date(purchase.created_at).toLocaleDateString("ko-KR")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {purchase.status === "completed" ? (
                          <>
                            <span className="inline-block px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-semibold">
                              결제 완료
                            </span>
                            <Button
                              onClick={() => {
                                const filename = (purchase.video as any)?.title
                                  ? `${(purchase.video as any).title.replace(/\s+/g, '_')}.py`
                                  : 'cheat_loader.py'
                                handleSecureDownload(purchase.id, filename)
                              }}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                            >
                              다운로드
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-sm font-semibold">
                              입금 확인 중
                            </span>
                            <Button disabled variant="outline" size="sm">
                              승인 대기
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
