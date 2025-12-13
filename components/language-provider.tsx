"use client"

import { createContext, useContext, useState } from "react"

type Language = "ko" | "en"

interface LanguageContextType {
    lang: Language
    toggleLang: () => void
    setLang: (lang: Language) => void
    t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
    ko: {
        "nav.all": "모든 제품",
        "nav.notices": "공지사항",
        "nav.reviews": "고객 후기",
        "hero.title": "최고의 발로란트 치트 & 스크립트",
        "hero.desc": "안전하고 강력한 기능으로 랭크를 지배하세요. 에임봇, ESP, 월핵 등 다양한 기능을 제공합니다.",
        "login": "로그인",
        "signup": "회원가입",
        "dashboard": "대시보드",
        "logout": "로그아웃",
        "footer.desc": "압도적인 성능의 발로란트 치트 플랫폼.",
        "footer.support": "고객 지원",
        "footer.faq": "FAQ",
        "footer.contact": "문의하기",
        "footer.refund": "환불 정책",
        "footer.info": "정보",
        "footer.privacy": "개인정보 보호",
        "footer.terms": "이용 약관",
        "footer.payment": "결제 방법",
        "review.title": "고객 후기",
        "review.subtitle": "실제 고객님들의 생생한 이용 후기입니다",
        "loading": "로딩 중...",
        "popup.today": "오늘 하루 보지 않기",
        "popup.close": "닫기"
    },
    en: {
        "nav.all": "All Products",
        "nav.notices": "Notices",
        "nav.reviews": "Reviews",
        "hero.title": "Best Valorant Cheats & Scripts",
        "hero.desc": "Dominate the rank with safe and powerful features. Aimbot, ESP, Wallhack and more.",
        "login": "Login",
        "signup": "Sign Up",
        "dashboard": "Dashboard",
        "logout": "Log Out",
        "footer.desc": "High performance Valorant cheat platform.",
        "footer.support": "Support",
        "footer.faq": "FAQ",
        "footer.contact": "Contact Us",
        "footer.refund": "Refund Policy",
        "footer.info": "Information",
        "footer.privacy": "Privacy Policy",
        "footer.terms": "Terms of Use",
        "footer.payment": "Payment Methods",
        "review.title": "Customer Reviews",
        "review.subtitle": "Real reviews from our customers",
        "loading": "Loading...",
        "popup.today": "Don't show again today",
        "popup.close": "Close"
    }
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLang] = useState<Language>("ko")

    const toggleLang = () => {
        setLang(prev => prev === "ko" ? "en" : "ko")
    }

    const t = (key: string) => {
        // Google Automatic Translation requires consistent source language (Korean).
        // We always return Korean so Google can translate it to target language.
        return translations['ko'][key] || key
    }

    return (
        <LanguageContext.Provider value={{ lang, toggleLang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export const useLanguage = () => {
    const context = useContext(LanguageContext)
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider")
    return context
}
