"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ShoppingCart, LogOut, User, Globe } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export default function Header() {
  const { t, lang, setLang } = useLanguage()
  const [user, setUser] = useState<any>(null)

  const changeLanguage = (targetLang: 'ko' | 'en') => {
    setLang(targetLang)

    // Cookie allows persistence on sub-page navigation/reloads
    const cookieValue = `/ko/${targetLang}`
    document.cookie = `googtrans=${cookieValue}; path=/`
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`

    // Trigger Google Translate manually without reload
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement
    if (combo) {
      combo.value = targetLang
      combo.dispatchEvent(new Event("change"))
    }
  }
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("사용자 정보 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-7xl z-50 rounded-2xl border border-border/40 bg-background/70 backdrop-blur-xl shadow-lg transition-all duration-300">
      <div className="px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center group-hover:bg-primary/30 transition-colors">
            <span className="text-primary font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">snacksnake</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 bg-secondary/30 px-6 py-2 rounded-full border border-border/20">
          <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.all')}
          </Link>
          <Link href="/notices" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.notices')}
          </Link>
          <a href="#reviews" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            {t('nav.reviews')}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-secondary/30 rounded-full p-1 border border-border/20">
            <Button variant="ghost" size="icon" onClick={() => changeLanguage('ko')} className={`h-7 w-7 rounded-full ${lang === 'ko' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`} title="한국어">
              <span className="text-base">🇰🇷</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => changeLanguage('en')} className={`h-7 w-7 rounded-full ${lang === 'en' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`} title="English">
              <span className="text-base">🇺🇸</span>
            </Button>
          </div>

          <Link href="/cart" className="relative group p-2">
            <ShoppingCart size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>

          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 hover:bg-primary/10 hover:text-primary">
                      <User size={16} />
                      <span className="hidden lg:inline">{t('dashboard')}</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-primary/10 hover:text-primary">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                      {t('signup')}
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
