"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Share2, Heart } from "lucide-react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

interface Product {
    id: string
    title: string
    description: string
    price: number
    thumbnail_url: string
    created_at: string
    stock?: number
    game_name?: string
}

const mockProducts: Product[] = [
    {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "발로란트 ESP & 월핵",
        thumbnail_url: "/cheat-esp-preview.jpg",
        description:
            "적의 위치를 벽 너머로 확인하세요. 랭크 게임에서의 압도적인 우위를 점할 수 있습니다.\n\n주요 기능:\n- 플레이어 뼈대/박스 표시\n- 체력 및 아머 상태 표시\n- 거리 표시\n- 스파이크 상태 확인\n\n안티치트 우회 기술이 적용되어 안전합니다.",
        price: 7500,
        stock: 99,
        created_at: new Date().toISOString(),
    },
    // ... (other mocks can stay without explicit stock, treated as undefined/unlimited or checks usually pass if check is loose, but safety: we assume mock has stock)
    // Actually safer to assume undefined stock = unlimited in frontend logic OR mock it.
    // I will just update the Interface and the Button logic. The logic `stock <= 0` handles undefined (undefined <= 0 is false). Wait, `undefined <= 0` is false. So it works (enabled).

    // ...


    {
        id: "550e8400-e29b-41d4-a716-446655440001",
        title: "사일런트 에임봇",
        thumbnail_url: "/cheat-aimbot-preview.jpg",
        description:
            "화면 흔들림 없이 정확하게 조준을 보정해줍니다. 관전자도 눈치채지 못하는 자연스러운 에임봇입니다.\n\n기능:\n- FOV 조절\n- 스무스 에이밍\n- 부위 선택 (머리/몸통)\n- 트리거봇 포함\n\n라디언트 유저들이 애용하는 설정이 기본 제공됩니다.",
        price: 9500,
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440002",
        title: "트리거봇 & 반동 제어",
        thumbnail_url: "/cheat-trigger-preview.jpg",
        description:
            "적이 조준점에 들어오면 자동으로 발사합니다. 완벽한 반동 제어로 모든 총기류를 레이저처럼 쏠 수 있습니다.\n\n특징:\n- 반응 속도 조절 가능\n- 모든 무기 반동 패턴 지원\n- 미세 조정 가능한 RCS\n\n초보자도 쉽게 고수가 될 수 있습니다.",
        price: 6500,
        created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440003",
        title: "스킨 체인저",
        thumbnail_url: "/cheat-skin-preview.jpg",
        description:
            "모든 발로란트 스킨을 무료로 사용하세요. 클라이언트 사이드 변조로 본인 화면에만 적용되어 밴 위험이 없습니다.\n\n제공:\n- 모든 총기 스킨 해금\n- 한정판 및 배틀패스 스킨 포함\n- 효과 및 피니셔 작동\n\n원하는 스킨으로 기분을 전환하세요.",
        price: 5000,
        created_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440004",
        title: "하드웨어 ID 스푸퍼",
        thumbnail_url: "/cheat-spoofer-preview.jpg",
        description:
            "하드웨어 밴을 회피하고 싶으신가요? HWID 스푸퍼로 컴퓨터의 고유 ID를 변경하여 차단을 우회하세요.\n\n기능:\n- 드라이브 시리얼 변경\n- MAC 주소 변경\n- 메인보드 정보 세탁\n- 영구적/일시적 변경 모드\n\n안전하게 게임을 다시 즐기세요.",
        price: 8500,
        created_at: new Date(Date.now() - 345600000).toISOString(),
    },
    {
        id: "550e8400-e29b-41d4-a716-446655440005",
        title: "랭크 헬퍼 스크립트",
        thumbnail_url: "/cheat-rank-helper.jpg",
        description:
            "자동 픽, 자동 수락, 자동 채팅 등 랭크 게임을 편리하게 도와주는 스크립트 모음입니다.\n\n기능:\n- 설치/해체 자동화 매크로\n- 버니합 스크립트\n- 픽창 칼픽 기능\n\n편리함의 끝판왕을 경험해보세요.",
        price: 4500,
        created_at: new Date(Date.now() - 432000000).toISOString(),
    },
]

export default function ProductDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedDuration, setSelectedDuration] = useState<string>("1일")
    const [finalPrice, setFinalPrice] = useState<number>(0)
    // Extract pricing tiers from description metadata
    const [customPricing, setCustomPricing] = useState<Record<string, string> | null>(null)

    useEffect(() => {
        if (selectedProduct?.description) {
            const match = selectedProduct.description.match(/<!--PRICING:(.*?)-->/)
            if (match && match[1]) {
                try {
                    const parsed = JSON.parse(match[1])
                    setCustomPricing(parsed)
                } catch (e) {
                    console.error("Failed to parse pricing metadata", e)
                }
            } else {
                setCustomPricing(null)
            }
        }
    }, [selectedProduct])

    // Pricing Logic (Base price: 7,500 KRW for 1 Day)
    const pricingOptions = [
        { label: "1일", duration: "1d", multiplier: 1, basePrice: 7500 },
        { label: "3일", duration: "3d", multiplier: 2.5, basePrice: 7500 }, // ~18,750 -> 18,000 (Manual override logic possible)
        { label: "7일", duration: "7d", multiplier: 5, basePrice: 7500 },
        { label: "10일", duration: "10d", multiplier: 7, basePrice: 7500 },
        { label: "15일", duration: "15d", multiplier: 10, basePrice: 7500 },
        { label: "30일", duration: "30d", multiplier: 18, basePrice: 7500 },
        { label: "영구제", duration: "perm", multiplier: 40, basePrice: 7500 },
    ]

    // Fixed prices for better visual appeal instead of raw multipliers
    const getPriceForDuration = (basePrice: number, duration: string) => {
        // 1. Check if custom pricing exists for this duration
        if (customPricing && customPricing[duration]) {
            const specificPrice = Number(customPricing[duration])
            if (!isNaN(specificPrice) && specificPrice > 0) {
                return specificPrice
            }
        }

        // 2. Fallback to multiplier logic
        // If basePrice is not standard (e.g. specialized products), scale accordingly
        // For this demo, we'll use fixed tiers based on the requirement "1 day: 7.5k"
        const scale = basePrice / 7500

        switch (duration) {
            case "1일":
                return 7500 * scale
            case "3일":
                return 19000 * scale
            case "7일":
                return 39000 * scale
            case "10일":
                return 55000 * scale
            case "15일":
                return 79000 * scale
            case "30일":
                return 149000 * scale
            case "영구제":
                return 350000 * scale
            default:
                return basePrice
        }
    }

    useEffect(() => {
        async function fetchProduct() {
            try {
                const supabase = createBrowserClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
                )

                const { data, error } = await supabase.from("videos").select("*").eq("id", params.id).single()

                console.log("[v0] Fetching product:", params.id, "Error:", error)

                if (!error && data) {
                    setSelectedProduct(data)
                } else {
                    // Fallback to mock data only if ID exists in mock data
                    const mockProduct = mockProducts.find((v) => v.id === params.id)
                    if (mockProduct) {
                        setSelectedProduct(mockProduct)
                    } else {
                        // Real product fetch failed and not a mock product -> likely 404
                        console.error("Product not found")
                        setSelectedProduct(null)
                    }
                }
            } catch (error) {
                console.log("[v0] Error fetching product:", error)
                const mockProduct = mockProducts.find((v) => v.id === params.id) || mockProducts[0]
                setSelectedProduct(mockProduct)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProduct()
    }, [params.id])

    useEffect(() => {
        if (selectedProduct) {
            // Use the product's base price from DB/Mock if available, otherwise default to 7500 logic
            // Assuming mock products have 'price' field which represents 1-day price or base value
            const calculatedPrice = getPriceForDuration(selectedProduct.price || 7500, selectedDuration)
            setFinalPrice(Math.round(calculatedPrice))
        }
    }, [selectedProduct, selectedDuration, customPricing])

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

    if (!selectedProduct) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <p>치트를 찾을 수 없습니다.</p>
                </main>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <main className="flex-1 px-4 md:px-8 lg:px-12 py-8">
                <div className="max-w-5xl mx-auto">
                    <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors">
                        <ChevronLeft size={20} />
                        <span>돌아가기</span>
                    </Link>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="mb-8 rounded-lg overflow-hidden bg-secondary">
                                <img
                                    src={selectedProduct.thumbnail_url || "/placeholder.svg"}
                                    alt={selectedProduct.title}
                                    className="w-full h-auto aspect-video object-cover"
                                />
                            </div>

                            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-2 block">
                                {selectedProduct.game_name || "Valorant"}
                            </span>

                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
                                {selectedProduct.title}
                            </h1>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                                <span className="text-foreground font-semibold">
                                    {new Date(selectedProduct.created_at).toLocaleDateString("ko-KR")}
                                </span>
                                <span>업데이트</span>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-foreground mb-4">치트 설명</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap">
                                    {selectedProduct.description.replace(/<!--[\s\S]*?-->/g, "").trim()}
                                </p>
                            </div>

                            <div className="flex items-center justify-center gap-6 mt-12 pt-8 border-t border-border">
                                <button className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                        <Share2 size={24} className="text-primary" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">공유</span>
                                </button>
                                <button className="flex flex-col items-center gap-2 hover:opacity-70 transition-opacity">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                                        <Heart size={24} className="text-primary" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">찜하기</span>
                                </button>
                            </div>
                        </div>

                        {/* 구매 사이드바 */}
                        <div className="lg:col-span-1">
                            <div className="bg-card rounded-lg border border-border p-8 sticky top-24">
                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground mb-2">이용 기간 선택</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {pricingOptions.map((option) => (
                                            <button
                                                key={option.label}
                                                onClick={() => setSelectedDuration(option.label)}
                                                className={`py-2 px-1 text-sm rounded-md border transition-all ${selectedDuration === option.label
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-background text-foreground border-input hover:border-primary/50"
                                                    }`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-4xl font-bold text-primary mb-6">
                                    ₩{finalPrice.toLocaleString()}
                                    {(selectedProduct.stock !== undefined && selectedProduct.stock <= 0) && (
                                        <span className="ml-4 text-xl text-red-500 font-bold">품절</span>
                                    )}
                                    {(selectedProduct.stock !== undefined && selectedProduct.stock > 0 && selectedProduct.stock < 10) && (
                                        <span className="ml-4 text-sm text-orange-500 font-bold">마감 임박 ({selectedProduct.stock}개 남음)</span>
                                    )}
                                </div>

                                <Button
                                    onClick={() => router.push(`/checkout/${selectedProduct.id}`)}
                                    className="w-full mb-4"
                                    size="lg"
                                    disabled={selectedProduct.stock !== undefined && selectedProduct.stock <= 0}
                                    variant={selectedProduct.stock !== undefined && selectedProduct.stock <= 0 ? "secondary" : "default"}
                                >
                                    {selectedProduct.stock !== undefined && selectedProduct.stock <= 0 ? "품절되었습니다" : "구매하기"}
                                </Button>

                                <div className="space-y-4 text-sm">
                                    <div className="p-3 bg-secondary rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">무통장입금</p>
                                        <p className="font-semibold text-foreground">국민은행</p>
                                        <p className="text-xs text-muted-foreground">123-456-789012</p>
                                    </div>
                                    <div className="p-3 bg-secondary rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">암호화폐 결제</p>
                                        <p className="font-semibold text-foreground">지원 중 (BTC, LTC)</p>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-secondary rounded-lg text-xs text-muted-foreground">
                                    <p className="font-semibold text-foreground mb-2">구매 보장</p>
                                    <p>24시간 내 환불 가능 / 영구제</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}
