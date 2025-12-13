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
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all duration-300 cursor-pointer group h-full flex flex-col">
        {/* Thumbnail */}
        <div
          className="relative overflow-hidden bg-secondary h-48 md:h-56"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img
            src={product.thumbnail || "/placeholder.svg"}
            alt={product.title}
            className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? "scale-110" : "scale-100"
              }`}
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />

          {/* Price Badge */}
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold">
            ₩{product.price.toLocaleString()}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {/* CTA Button */}
          <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 rounded-lg transition-colors">
            상세 보기
          </button>
        </div>
      </div>
    </Link>
  )
}
