"use client"

import { useRouter, usePathname } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalBackButton() {
    const router = useRouter()
    const pathname = usePathname()

    if (pathname === "/") return null

    return (
        <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 left-6 z-40 rounded-full h-14 w-14 shadow-xl bg-background/80 backdrop-blur border-border hover:bg-secondary transition-all"
            onClick={() => router.back()}
            title="뒤로 가기"
        >
            <ArrowLeft size={24} />
        </Button>
    )
}
