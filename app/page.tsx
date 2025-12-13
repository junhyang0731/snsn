"use client"
import Header from "@/components/header"
import ProductGrid from "@/components/product-grid"
import Footer from "@/components/footer"
import ReviewSection from "@/components/review-section"
import MainPopup from "@/components/main-popup"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Product {
  id: string
  title: string
  thumbnail: string
  price: number
  views?: number
  rating?: number
}

export default function Home() {
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
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      title: "사일런트 에임봇",
      thumbnail: "/snacksnake_logo_default.png",
      price: 9500,
      views: 892,
      rating: 4.7,
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      title: "트리거봇 & 반동 제어",
      thumbnail: "/snacksnake_logo_default.png",
      price: 6500,
      views: 2341,
      rating: 4.9,
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
          .select("id, title, thumbnail_url, price")
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
          <div className="text-center text-muted-foreground">로딩 중...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              최고의 발로란트 치트 & 스크립트
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl text-pretty">
              안전하고 강력한 기능으로 랭크를 지배하세요. 에임봇, ESP, 월핵 등 다양한 기능을 제공합니다.
            </p>
          </div>
          <ProductGrid products={products} />

          <div id="reviews" className="mt-24 border-t border-border pt-12">
            <ReviewSection />
          </div>
        </div>
        <MainPopup />
      </main>
      <Footer />
    </div>
  )
}
