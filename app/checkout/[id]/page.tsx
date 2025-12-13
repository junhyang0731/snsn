"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Check, Copy } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface Video {
  id: string
  title: string
  price: number
  thumbnail_url: string
  stock?: number
}

interface Profile {
  coin_balance: number
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const [video, setVideo] = useState<Video | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "bitcoin" | "litecoin" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [copied, setCopied] = useState(false)
  const [bankName, setBankName] = useState("")
  const [depositorName, setDepositorName] = useState("")
  const [showBankInput, setShowBankInput] = useState(false)
  const supabase = createClient()

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

        const { data: videoData } = await supabase.from("videos").select("*").eq("id", params.id).single()

        const { data: profileData } = await supabase.from("profiles").select("coin_balance").eq("id", user.id).single()

        setVideo(videoData as Video)
        setProfile(profileData as Profile)
      } catch (error) {
        console.error("데이터 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id, router, supabase])



  const checkDuplicateDeployer = async (bank: string, name: string) => {
    const searchString = `bank_transfer:${bank}:${name}`
    const { data, error } = await supabase
      .from("purchases")
      .select("id")
      .eq("payment_method", searchString)
      .maybeSingle()

    if (error) {
      console.error("Error checking duplicate:", error)
      return false
    }
    return !!data
  }

  const handleBankTransfer = async () => {
    if (!showBankInput) {
      setShowBankInput(true)
      return
    }

    if (!bankName || !depositorName) {
      alert("은행명과 입금자명을 입력해주세요.")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const isDuplicate = await checkDuplicateDeployer(bankName, depositorName)
    if (isDuplicate) {
      alert("이미 해당 은행/예금주 명으로 등록된 구매 내역이 있습니다. 다른 예금주명을 사용해주세요.")
      return
    }

    setIsProcessing(true)
    try {
      // Stock Check
      const { data: latestVideo } = await supabase.from('videos').select('stock').eq('id', video!.id).single()
      if (latestVideo?.stock !== undefined && latestVideo.stock <= 0) {
        throw new Error("재고가 소진되었습니다")
      }

      const paymentMethodString = `bank_transfer:${bankName}:${depositorName}`

      const { data, error } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          video_id: video?.id,
          payment_method: paymentMethodString,
          amount: video?.price,
          status: "pending",
          bank_account: "국민은행 123-456-789012",
          stock_quantity_at_purchase: latestVideo?.stock
        })
        .select()
        .single()

      if (error) throw error

      // Decrement Stock
      if (latestVideo?.stock !== undefined) {
        await supabase.from("videos").update({ stock: latestVideo.stock - 1 }).eq("id", video!.id)
      }

      setOrderId(data.id)
      setPaymentMethod("bank")
      alert("입금 신청이 완료되었습니다. 입금이 확인되면 승인 처리됩니다.")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "주문 생성 실패")
    } finally {
      setIsProcessing(false)
    }
  }

  // NOTE: handleConfirmDeposit is no longer needed as handleBankTransfer does it all now.

  const handleBitcoin = async () => {
    setIsProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !video) throw new Error("데이터 없음")

      const { data, error } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          video_id: video.id,
          payment_method: "bitcoin",
          amount: video.price,
          status: "pending",
          bitcoin_address: "1A1z7agoat2LWQLRZFB2tqKFHHU5i8sqFm",
        })
        .select()
        .single()

      if (error) throw error

      setOrderId(data.id)
      setPaymentMethod("bitcoin")
    } catch (error) {
      alert(error instanceof Error ? error.message : "주문 생성 실패")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLitecoin = async () => {
    setIsProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !video) throw new Error("데이터 없음")

      const { data, error } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          video_id: video.id,
          payment_method: "litecoin",
          amount: video.price,
          status: "pending",
          bitcoin_address: "ltc1q7tuvfhpj82su2tnjy7plu2y6m2x2eh2enuw38m",
        })
        .select()
        .single()

      if (error) throw error

      setOrderId(data.id)
      setPaymentMethod("litecoin")
    } catch (error) {
      alert(error instanceof Error ? error.message : "주문 생성 실패")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCoinPayment = async () => {
    setIsProcessing(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !video || !profile) throw new Error("데이터 없음")

      // Stock Check
      const { data: latestVideo } = await supabase.from('videos').select('stock').eq('id', video.id).single()
      if (latestVideo?.stock !== undefined && latestVideo.stock <= 0) {
        throw new Error("재고가 소진되었습니다")
      }

      if (profile.coin_balance < video.price) {
        throw new Error("코인 잔액이 부족합니다")
      }

      // Create purchase record
      const { error: purchaseError } = await supabase.from("purchases").insert({
        user_id: user.id,
        video_id: video.id,
        payment_method: "coin", // Fixed from 'bitcoin' to 'coin'
        amount: video.price,
        status: "completed",
        stock_quantity_at_purchase: latestVideo?.stock // Optional: Record stock at purchase time
      })

      if (purchaseError) throw purchaseError

      // Update coin balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          coin_balance: profile.coin_balance - video.price,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Decrement Stock
      if (latestVideo?.stock !== undefined) {
        await supabase.from("videos").update({ stock: latestVideo.stock - 1 }).eq("id", video.id)
      }

      alert("결제 완료되었습니다!")
      router.push("/purchases")
    } catch (error) {
      alert(error instanceof Error ? error.message : "결제 실패")
    } finally {
      setIsProcessing(false)
    }
  }

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

  if (!video) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>영상을 찾을 수 없습니다</p>
        </main>
        <Footer />
      </div>
    )
  }

  // 무통장입금 단계
  if (paymentMethod === "bank" && orderId) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
              <ArrowLeft size={20} />
              돌아가기
            </Link>

            <Card>
              <CardHeader>
                <CardTitle>무통장입금 결제</CardTitle>
                <CardDescription>아래 계좌로 입금해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check size={24} className="text-green-600" />
                    <h3 className="text-lg font-semibold text-green-600">주문 생성 완료</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">주문번호: {orderId}</p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">은행</p>
                    <p className="text-xl font-bold text-foreground">국민은행</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">계좌번호</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-mono font-bold text-foreground">123-456-789012</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("123-456-789012")
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">예금주</p>
                    <p className="text-lg font-semibold text-foreground">snacksnake</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">입금액</p>
                    <p className="text-2xl font-bold text-primary">${video.price}</p>
                  </div>
                </div>



                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    입금 후 영상이 자동으로 제공됩니다. 입금 확인까지 약 1-2분 소요됩니다.
                  </p>
                </div>

                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  쇼핑 계속하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // 비트코인 결제 단계
  if (paymentMethod === "bitcoin" && orderId) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
              <ArrowLeft size={20} />
              돌아가기
            </Link>

            <Card>
              <CardHeader>
                <CardTitle>비트코인 결제</CardTitle>
                <CardDescription>아래 지갑 주소로 비트코인을 전송해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check size={24} className="text-green-600" />
                    <h3 className="text-lg font-semibold text-green-600">주문 생성 완료</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">주문번호: {orderId}</p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">비트코인 지갑 주소</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm font-mono break-all text-foreground bg-secondary p-3 rounded-lg flex-1">
                        1A1z7agoat2LWQLRZFB2tqKFHHU5i8sqFm
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("1A1z7agoat2LWQLRZFB2tqKFHHU5i8sqFm")
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">결제액</p>
                    <p className="text-2xl font-bold text-primary">${video.price}</p>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-sm text-orange-900">
                    비트코인 결제는 블록체인 확인 후 자동으로 처리됩니다. 네트워크 상황에 따라 5-30분 소요될 수
                    있습니다.
                  </p>
                </div>

                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  쇼핑 계속하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // 라이트코인 결제 단계
  if (paymentMethod === "litecoin" && orderId) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
          <div className="max-w-2xl mx-auto">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
              <ArrowLeft size={20} />
              돌아가기
            </Link>

            <Card>
              <CardHeader>
                <CardTitle>라이트코인 결제</CardTitle>
                <CardDescription>아래 지갑 주소로 라이트코인을 전송해주세요</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Check size={24} className="text-green-600" />
                    <h3 className="text-lg font-semibold text-green-600">주문 생성 완료</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">주문번호: {orderId}</p>
                </div>

                <div className="bg-card rounded-lg border border-border p-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">라이트코인 지갑 주소</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-sm font-mono break-all text-foreground bg-secondary p-3 rounded-lg flex-1">
                        ltc1q7tuvfhpj82su2tnjy7plu2y6m2x2eh2enuw38m
                      </p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText("ltc1q7tuvfhpj82su2tnjy7plu2y6m2x2eh2enuw38m")
                          setCopied(true)
                          setTimeout(() => setCopied(false), 2000)
                        }}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">결제액</p>
                    <p className="text-2xl font-bold text-primary">${video.price}</p>
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-sm text-orange-900">
                    라이트코인 결제는 블록체인 확인 후 자동으로 처리됩니다. 네트워크 상황에 따라 5-30분 소요될 수
                    있습니다.
                  </p>
                </div>

                <Button variant="outline" onClick={() => router.push("/")} className="w-full">
                  쇼핑 계속하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // 결제 방식 선택 단계
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href={`/video/${video.id}`} className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6">
            <ArrowLeft size={20} />
            돌아가기
          </Link>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>주문 요약</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <img
                src={video.thumbnail_url || "/placeholder.svg"}
                alt={video.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{video.title}</h3>
                <p className="text-2xl font-bold text-primary mt-2">${video.price}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>결제 방법 선택</CardTitle>
              <CardDescription>원하는 결제 방식을 선택해주세요</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className={`rounded-lg border-2 transition-all ${showBankInput ? 'border-primary bg-secondary/10' : 'border-border hover:border-primary hover:bg-secondary/50'}`}>
                <button
                  onClick={handleBankTransfer}
                  disabled={isProcessing}
                  className="w-full p-4 text-left"
                >
                  <p className="font-semibold text-foreground">무통장입금</p>
                  <p className="text-sm text-muted-foreground">국민은행 123-456-789012</p>
                </button>

                {showBankInput && (
                  <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">입금 은행명</label>
                      <Input
                        placeholder="예: 국민은행"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">입금자명 (중복 불가)</label>
                      <Input
                        placeholder="예: 홍길동"
                        value={depositorName}
                        onChange={(e) => setDepositorName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <Button
                      onClick={handleBankTransfer}
                      disabled={isProcessing}
                      className="w-full mt-2"
                    >
                      {isProcessing ? "처리 중..." : "결제하기"}
                    </Button>
                  </div>
                )}
              </div>

              <button
                onClick={handleBitcoin}
                disabled={isProcessing}
                className="w-full p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left hover:bg-secondary/50 disabled:opacity-50"
              >
                <p className="font-semibold text-foreground">비트코인 결제</p>
                <p className="text-sm text-muted-foreground">블록체인을 통한 즉시 결제</p>
              </button>

              <button
                onClick={handleLitecoin}
                disabled={isProcessing}
                className="w-full p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left hover:bg-secondary/50 disabled:opacity-50"
              >
                <p className="font-semibold text-foreground">라이트코인 결제</p>
                <p className="text-sm text-muted-foreground">라이트코인으로 즉시 결제</p>
              </button>

              {profile && profile.coin_balance > 0 && (
                <button
                  onClick={handleCoinPayment}
                  disabled={isProcessing || profile.coin_balance < video.price}
                  className="w-full p-4 rounded-lg border-2 border-border hover:border-primary transition-all text-left hover:bg-secondary/50 disabled:opacity-50"
                >
                  <p className="font-semibold text-foreground">코인 결제</p>
                  <p className="text-sm text-muted-foreground">보유 코인: ${profile.coin_balance}</p>
                </button>
              )}
            </CardContent>
          </Card>
        </div>
      </main >
      <Footer />
    </div >
  )
}
