"use client"

import { useEffect, useState } from "react"

export default function LanguageOverlay() {
    const [showOverlay, setShowOverlay] = useState(false)

    useEffect(() => {
        // Check if language is already selected
        const savedLang = localStorage.getItem("language")
        if (!savedLang) {
            setShowOverlay(true)
        }
    }, [])

    const handleSelectLanguage = (lang: string) => {
        localStorage.setItem("language", lang)
        setShowOverlay(false)
        // Optional: Refresh page or set global context if needed
        // location.reload() 
    }

    if (!showOverlay) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <h2 className="text-3xl font-bold text-white mb-12">Select Your Region</h2>

            <div className="flex gap-8 md:gap-16">
                <button
                    onClick={() => handleSelectLanguage("ko")}
                    className="group flex flex-col items-center gap-4 transition-transform hover:scale-110 active:scale-95"
                >
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary shadow-2xl transition-all">
                        <img
                            src="https://flagcdn.com/w320/kr.png"
                            alt="Korea"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-xl font-bold text-white group-hover:text-primary transition-colors">Korea</span>
                </button>

                <button
                    onClick={() => handleSelectLanguage("en")}
                    className="group flex flex-col items-center gap-4 transition-transform hover:scale-110 active:scale-95"
                >
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary shadow-2xl transition-all">
                        <img
                            src="https://flagcdn.com/w320/us.png"
                            alt="USA"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <span className="text-xl font-bold text-white group-hover:text-primary transition-colors">USA</span>
                </button>
            </div>
        </div>
    )
}
