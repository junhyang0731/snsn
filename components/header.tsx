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
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </div>
          <span className="text-xl font-bold text-foreground hidden md:inline">snacksnake</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-foreground hover:text-primary transition-colors">
            {t('nav.all')}
          </Link>
          <Link href="/notices" className="text-foreground hover:text-primary transition-colors">
            {t('nav.notices')}
          </Link>
          <a href="#reviews" className="text-foreground hover:text-primary transition-colors">
            {t('nav.reviews')}
          </a>
        </nav>

        <div className="flex items-center gap-1 mr-4">
          <Button variant="ghost" size="icon" onClick={() => changeLanguage('ko')} className={`h-8 w-8 px-0 ${lang === 'ko' ? 'opacity-100 bg-accent/50 scale-110' : 'opacity-40 hover:opacity-100'}`} title="한국어">
            <span className="text-2xl">🇰🇷</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => changeLanguage('en')} className={`h-8 w-8 px-0 ${lang === 'en' ? 'opacity-100 bg-accent/50 scale-110' : 'opacity-40 hover:opacity-100'}`} title="English">
            <span className="text-2xl">🇺🇸</span>
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/cart" className="hover:text-primary transition-colors">
            <ShoppingCart size={20} />
          </Link>

          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                      <User size={16} />
                      {t('dashboard')}
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                    <LogOut size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      {t('login')}
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">{t('signup')}</Button>
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
