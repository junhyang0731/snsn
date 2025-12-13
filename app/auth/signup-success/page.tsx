"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">회원가입 완료!</CardTitle>
          <CardDescription>snacksnake에 오신 것을 환영합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3 rounded-lg bg-accent p-4 text-sm">
            <p className="font-medium text-foreground">이메일 인증이 필요합니다</p>
            <p className="text-muted-foreground">
              등록하신 이메일 주소로 인증 링크를 보내드렸습니다. 이메일을 확인하여 계정을 활성화해주세요.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">메일을 받지 못하셨나요?</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">1.</span>
                <span>스팸 폴더를 확인해주세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-foreground">2.</span>
                <span>등록하신 이메일 주소가 맞는지 확인해주세요</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Link href="/auth/login" className="block">
              <Button className="w-full">로그인</Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                홈으로
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
