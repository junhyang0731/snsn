"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { LogOut, Settings, Upload } from "lucide-react"

interface Profile {
  id: string
  display_name: string
  email: string
  coin_balance: number
  is_admin: boolean
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setProfile(data as Profile)
      } catch (error) {
        console.error("프로필 로드 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (isLoading) return <div className="text-center py-12">로딩 중...</div>

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">대시보드</h1>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut size={18} />
            로그아웃
          </Button>
        </div>

        {profile && (
          <>
            {/* 프로필 카드 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>프로필</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">닉네임</p>
                  <p className="text-lg font-semibold">{profile.display_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">이메일</p>
                  <p className="text-lg">{profile.email}</p>
                </div>

              </CardContent>
            </Card>

            {/* 어드민 패널 */}
            {profile.is_admin && (
              <Card className="border-primary/50 bg-primary/5 mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings size={20} />
                    어드민 패널
                  </CardTitle>
                  <CardDescription>영상 관리 및 판매 통계</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href="/admin">
                    <Button className="gap-2">
                      <Upload size={18} />
                      어드민 대시보드 열기
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* 구매 이력 */}
            <Card>
              <CardHeader>
                <CardTitle>최근 구매 영상</CardTitle>
                <CardDescription>구매한 영상 보기</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/purchases">
                  <Button variant="outline">구매 이력 보기</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
