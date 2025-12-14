"use client"
import Header from "@/components/header"
import ProductGrid from "@/components/product-grid"
import Footer from "@/components/footer"
import ReviewSection from "@/components/review-section"
import MainPopup from "@/components/main-popup"
import { useLanguage } from "@/components/language-provider"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Product {
  id: string
  title: string
  thumbnail: string
  price: number
  views?: number
  rating?: number
  game_name?: string
}

export default function Home() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const mockProducts: Product[] = [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "발로란트 ESP & 월핵",
      thumbnail: "/snacksnake_logo_default.png",
      price: 7500,
      views: 1250,
      rating: 4.8,
      game_name: "Valorant",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "사일런트 에임봇",
      thumbnail: "/snacksnake_logo_default.png",
      price: 9500,
      views: 892,
      rating: 4.7,
      game_name: "Valorant",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      title: "트리거봇 & 반동 제어",
      thumbnail: "/snacksnake_logo_default.png",
      price: 6500,
      views: 2341,
      rating: 4.9,
      game_name: "Valorant",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      title: "스킨 체인저",
      thumbnail: "/snacksnake_logo_default.png",
      price: 5000,
      views: 1567,
      rating: 4.6,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      title: "하드웨어 ID 스푸퍼",
      thumbnail: "/snacksnake_logo_default.png",
      price: 8500,
      views: 945,
      rating: 4.5,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440005",
      title: "랭크 헬퍼 스크립트",
      thumbnail: "/snacksnake_logo_default.png",
      price: 4500,
      views: 3421,
      rating: 4.9,
    },
  ]

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("videos")
          .select("id, title, thumbnail_url, price, game_name")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("데이터베이스 쿼리 오류:", error)
          setProducts(mockProducts)
          return
        }

        if (data && data.length > 0) {
          const dbProducts = data.map((v: any) => ({
            id: v.id,
            title: v.title,
            thumbnail: v.thumbnail_url || "/snacksnake_logo_default.png",
            price: v.price,
            views: 0,
            rating: 5.0,
            game_name: v.game_name || "Valorant",
          }))
          setProducts(dbProducts)
        } else {
          setProducts(mockProducts)
        }
      } catch (error) {
        console.error("상품 로드 실패:", error)
        setProducts(mockProducts)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full" />
            <div className="text-muted-foreground">LOADING SYSTEM...</div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background relative selection:bg-primary/30">
      {/* Ambient Background Gradient */}
      {/* Clean Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-background" />

      <Header />

      <main className="flex-1 relative z-10 pt-32 pb-20 px-4 md:px-8">

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto text-center mb-32 relative">
          <div className="inline-block px-4 py-1.5 rounded-full border border-border bg-secondary/50 text-foreground/80 text-sm font-medium mb-8">
            v2.16 Update Live
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent pb-2">
            {t('hero.title')}
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-light">
            {t('hero.desc')}
          </p>

          <div className="flex justify-center gap-6">
            <Link href="#products">
              <Button size="lg" className="rounded-full px-10 h-14 text-lg font-semibold shadow-[0_0_30px_-5px_var(--primary)] hover:shadow-[0_0_40px_-5px_var(--primary)] transition-all duration-500">
                Get Access
              </Button>
            </Link>
            <Link href="/notices">
              <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg border-primary/20 hover:bg-primary/5">
                View Notices
              </Button>
            </Link>
          </div>
        </div>

        {/* Products Section */}
        <div id="products" className="max-w-7xl mx-auto mb-32">
          <div className="flex items-end justify-between mb-10 px-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Featured Cheats</h2>
              <p className="text-muted-foreground">Undetected, Secure, and High Performance</p>
            </div>
          </div>

          <div className="p-1">
            <ProductGrid products={products} />
          </div>
        </div>

        {/* Reviews Section */}
        <div id="reviews" className="max-w-7xl mx-auto py-12 border-t border-border/40">
          <ReviewSection />
        </div>

        <MainPopup />
      </main>

      <Footer />
    </div>
  )
}
