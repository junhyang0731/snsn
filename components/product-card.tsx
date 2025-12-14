"use client"

import Link from "next/link"
import { useState } from "react"

interface ProductCardProps {
  product: {
    id: string
    title: string
    thumbnail: string
    price: number
    views?: number
    rating?: number
    game_name?: string
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative overflow-hidden bg-secondary aspect-video">
          <img
            src={product.thumbnail || "/placeholder.svg"}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <span className="text-xs font-semibold text-primary/80 mb-1 block uppercase tracking-wider">
            {product.game_name || "Valorant"}
          </span>
          <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          <div className="mt-auto flex items-center justify-between">
            <span className="text-xl font-bold text-primary">
              ₩{product.price.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              자세히 보기 →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
