"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Loader2, SendHorizontal } from "lucide-react"

export default function FeedbackModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    const handleSubmit = async () => {
        if (!content.trim()) return

        setIsSubmitting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { error } = await supabase.from("feedback").insert({
                content: content,
                user_id: user?.id || null // Login optional
            })

            if (error) throw error

            setContent("")
            setIsOpen(false)
            alert("소중한 의견 감사합니다! 개발자에게 전달되었습니다.")
        } catch (error) {
            console.error(error)
            alert("전송에 실패했습니다.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    📢 개발자에게 말한다
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>개발자에게 한마디</DialogTitle>
                    <DialogDescription>
                        사이트 이용 중 불편한 점이나<br />추가되었으면 하는 기능을 자유롭게 적어주세요.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="예: 로블록스 킹피스 치트도 추가해주세요! / 결제가 너무 복잡해요."
                        className="min-h-[150px] resize-none"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>취소</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()}>
                        {isSubmitting ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <SendHorizontal className="w-4 h-4 mr-2" />}
                        전송하기
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
