"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Check, Copy, AlertTriangle } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"

interface Video {
  id: string
  title: string
  price: number
  thumbnail_url: string
  stock?: number
}

const BANK_LIST = [
  { name: "카카오뱅크", color: "bg-yellow-300 text-black hover:bg-yellow-400" },
  { name: "토스뱅크", color: "bg-blue-500 text-white hover:bg-blue-600" },
  { name: "농협", color: "bg-green-600 text-white hover:bg-green-700" },
  { name: "국민", color: "bg-yellow-500 text-black hover:bg-yellow-600" },
  { name: "신한", color: "bg-blue-700 text-white hover:bg-blue-800" },
  { name: "우리", color: "bg-blue-400 text-white hover:bg-blue-500" },
  { name: "기업", color: "bg-blue-800 text-white hover:bg-blue-900" },
  { name: "하나", color: "bg-teal-600 text-white hover:bg-teal-700" },
]

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [video, setVideo] = useState<Video | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"bank" | "bitcoin" | "litecoin" | "tron" | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderId, setOrderId] = useState("")
  const [copied, setCopied] = useState(false)

  // Bank Transfer States
  const [bankName, setBankName] = useState("")
  const [depositorName, setDepositorName] = useState("")
  const [showBankInput, setShowBankInput] = useState(false)
  const [isManualBank, setIsManualBank] = useState(false)

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

        if (searchParams.get("price")) {
          // Override price if provided in URL (e.g. 30days option)
          (videoData as any).price = Number(searchParams.get("price"))
        }
        setVideo(videoData as Video)
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
      .eq("status", "pending") // Only check pending to avoid blocking repeats after completion? Or always block?
      // User said "Unique depositor name" logic. Let's keep it safe.
      .maybeSingle()

    if (error) return false
    return !!data
  }

  const handleBankTransfer = async () => {
    if (!showBankInput) {
      setShowBankInput(true)
      return
    }

    if (!bankName || !depositorName) {
      alert("은행과 입금자명을 입력해주세요.")
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
      return
    }

    const isDuplicate = await checkDuplicateDeployer(bankName, depositorName)
    if (isDuplicate) {
      alert("이미 해당 은행/예금주 명으로 등록된 대기 중인 주문이 있습니다. 처리를 기다려주세요.")
      return
    }

    setIsProcessing(true)
    try {
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
          bank_account: "토스뱅크 (계좌번호는 추후 안내)",
          stock_quantity_at_purchase: latestVideo?.stock,
          duration: searchParams.get("duration") || "1일"
        })
        .select()
        .single()

      if (error) throw error

      // We do NOT decrement stock here. Stock is decremented upon APPROVAL (FIFO logic).
      // Only "display stock" might be decremented locally if we want, but better keep it real.

      setOrderId(data.id)
      setPaymentMethod("bank")
      // alert("입금 신청이 완료되었습니다.") 
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "주문 생성 실패")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCryptoPayment = async (method: "bitcoin" | "litecoin" | "tron", address: string) => {
    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !video) throw new Error("데이터 없음")

      // Stock Check
      const { data: latestVideo } = await supabase.from('videos').select('stock').eq('id', video.id).single()

      const currentStock = latestVideo?.stock ?? 0;
      if (latestVideo?.stock !== undefined && currentStock <= 0) {
        throw new Error("재고가 소진되었습니다")
      }

      const { data, error } = await supabase
        .from("purchases")
        .insert({
          user_id: user.id,
          video_id: video.id,
          payment_method: method,
          amount: video.price,
          status: "pending",
          bitcoin_address: address, // Reusing column or need new one? 'bitcoin_address' works as generic address field
          stock_quantity_at_purchase: currentStock,
          duration: searchParams.get("duration") || "1일"
        })
        .select()
        .single()

      if (error) throw error

      setOrderId(data.id)
      setPaymentMethod(method)
    } catch (error) {
      alert(error instanceof Error ? error.message : "주문 생성 실패")
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  if (!video) return <div className="min-h-screen flex items-center justify-center">상품 없음</div>

  // --- Payment Result Screens ---
  if (orderId && paymentMethod) {
    const isCrypto = ["bitcoin", "litecoin", "tron"].includes(paymentMethod)
    let address = ""
    let coinName = ""

    if (paymentMethod === "bitcoin") { address = "1A1z7agoat2LWQLRZFB2tqKFHHU5i8sqFm"; coinName = "비트코인(BTC)" }
    if (paymentMethod === "litecoin") { address = "LRZyhXi6RVYHboot7e1SW39Q9zZTwqTK Nt"; coinName = "라이트코인(LTC)" }
    if (paymentMethod === "tron") { address = "TLr5z1YMucZUW5RMMzmHCq9r6 QUKcESbqm"; coinName = "트론(TRX)" }

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="text-green-500" /> 주문 접수 완료
                </CardTitle>
                <CardDescription>주문번호: {orderId}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentMethod === 'bank' ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg bg-secondary/20">
                      <p className="text-sm text-muted-foreground">입금하실 계좌</p>
                      <p className="text-xl font-bold">토스뱅크 1000-0000-0000</p>
                      <p className="text-sm text-muted-foreground">(예금주: 홍길동)</p>
                      <div className="mt-2 text-xs text-red-500 font-bold">
                        * 아직 계좌번호가 확정되지 않았습니다. 관리자에게 문의하세요.
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
                      <strong>{bankName} {depositorName}</strong> 명의로 입금해주셔야 확인이 가능합니다.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="font-medium text-lg">아래 주소로 <span className="text-primary font-bold">{video.price}원</span> 상당의 {coinName}을 전송하세요.</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 block p-3 bg-secondary rounded text-sm break-all font-mono">
                        {address}
                      </code>
                      <Button variant="outline" size="icon" onClick={() => {
                        navigator.clipboard.writeText(address)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}>
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      네트워크 상황에 따라 입금 확인까지 5~30분이 소요될 수 있습니다.
                    </p>
                  </div>
                )}

                <Button className="w-full" onClick={() => router.push("/purchases")}>
                  내 구매 내역 확인하기
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // --- Selection Screen ---
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link href={`/product/${video.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={16} /> 뒤로가기
          </Link>

          <div className="grid gap-6">
            {/* Product Summary */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-card">
              <img src={video.thumbnail_url} className="w-20 h-20 object-cover rounded-md" alt="" />
              <div>
                <h3 className="font-bold">{video.title}</h3>
                <p className="text-primary font-bold text-lg">₩{video.price.toLocaleString()}</p>
              </div>
            </div>

            {/* 1. Bank Transfer */}
            <Card className={`cursor-pointer transition-all ${showBankInput ? 'ring-2 ring-primary' : 'hover:border-primary'}`}>
              <CardHeader className="cursor-pointer" onClick={() => setShowBankInput(true)}>
                <CardTitle>무통장 입금</CardTitle>
                <CardDescription>국내 은행 계좌로 이체합니다.</CardDescription>
              </CardHeader>
              {showBankInput && (
                <CardContent className="animate-in slide-in-from-top-2 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">입금자명 입력</label>
                    <Input
                      placeholder="예: 홍길동"
                      value={depositorName}
                      onChange={(e) => setDepositorName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">어떤 은행에서 보내시나요?</label>

                    {!isManualBank ? (
                      <div className="grid grid-cols-4 gap-2">
                        {BANK_LIST.map((bank) => (
                          <button
                            key={bank.name}
                            onClick={() => setBankName(bank.name)}
                            className={`p-2 rounded-md text-sm font-bold transition-all ${bank.color} ${bankName === bank.name ? 'ring-4 ring-offset-2 ring-primary scale-105' : 'opacity-80 hover:opacity-100'}`}
                          >
                            {bank.name}
                          </button>
                        ))}
                        <button
                          onClick={() => { setIsManualBank(true); setBankName(""); }}
                          className="col-span-4 mt-2 text-sm text-muted-foreground underline hover:text-foreground"
                        >
                          여기에 없나요? (직접 입력)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Input
                          placeholder="은행명 직접 입력 (예: 수협)"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          autoFocus
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <AlertTriangle size={12} />
                            수동 입력시 처리가 늦어질 수 있습니다. 국내 은행만 가능해요.
                          </p>
                          <button onClick={() => setIsManualBank(false)} className="text-xs underline text-muted-foreground mr-1">
                            목록에서 선택
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button className="w-full mt-2" onClick={handleBankTransfer} disabled={isProcessing}>
                    {isProcessing ? "처리 중..." : "입금 신청하기"}
                  </Button>
                </CardContent>
              )}
            </Card>

            {/* 2. Crypto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => handleCryptoPayment("bitcoin", "1A1z7agoat2LWQLRZFB2tqKFHHU5i8sqFm")}
                disabled={isProcessing}
                className="p-4 border rounded-lg hover:border-orange-500 hover:bg-orange-500/5 transition-all flex flex-col items-center gap-2"
              >
                <span className="font-bold text-orange-600">Bitcoin</span>
                <span className="text-xs text-muted-foreground">BTC</span>
              </button>
              <button
                onClick={() => handleCryptoPayment("litecoin", "LRZyhXi6RVYHboot7e1SW39Q9zZTwqTK Nt")}
                disabled={isProcessing}
                className="p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-500/5 transition-all flex flex-col items-center gap-2"
              >
                <span className="font-bold text-blue-600">Litecoin</span>
                <span className="text-xs text-muted-foreground">LTC</span>
              </button>
              <button
                onClick={() => handleCryptoPayment("tron", "TLr5z1YMucZUW5RMMzmHCq9r6 QUKcESbqm")}
                disabled={isProcessing}
                className="p-4 border rounded-lg hover:border-red-500 hover:bg-red-500/5 transition-all flex flex-col items-center gap-2"
              >
                <span className="font-bold text-red-600">Tron</span>
                <span className="text-xs text-muted-foreground">TRX</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
