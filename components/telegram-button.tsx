"use client"

import { MessageCircle } from "lucide-react"
import { useEffect, useState } from "react"

export default function TelegramButton() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        // Show button after 1 second
        const timer = setTimeout(() => setIsVisible(true), 1000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <a
            href="https://t.me/snacksnake_support"
            target="_blank"
            rel="noopener noreferrer"
            className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 hover:scale-110 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
                }`}
        >
            <div className="relative group">
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
                <div className="relative flex items-center justify-center w-14 h-14 bg-[#2AABEE] text-white rounded-full shadow-xl border-2 border-white/20">
                    <MessageCircle size={30} fill="white" className="ml-[-2px] mt-[1px]" />
                </div>
                <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur px-3 py-1 rounded-lg text-sm font-medium border border-border/50 text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    1:1 문의하기
                </span>
            </div>
        </a>
    )
}
