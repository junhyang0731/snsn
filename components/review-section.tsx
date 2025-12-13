"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Star, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Review {
    id: string
    nickname: string
    content: string
    rating: number
    created_at: string
    user_id: string
}

export default function ReviewSection() {
    const [reviews, setReviews] = useState<Review[]>([])
    const [rating, setRating] = useState(5)
    const [content, setContent] = useState("")
    const [nickname, setNickname] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchReviews()
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
            const { data } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
            setIsAdmin(!!data?.is_admin)

            // Try to pre-fill nickname from email if possible
            if (user.email) {
                setNickname(user.email.split('@')[0].slice(0, 3) + "**")
            }
        }
    }

    const fetchReviews = async () => {
        const { data } = await supabase
            .from("reviews")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20)

        if (data) setReviews(data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            alert("로그인이 필요합니다.")
            return
        }
        if (content.length < 5) {
            alert("내용을 5자 이상 입력해주세요.")
            return
        }

        setIsSubmitting(true)
        try {
            // Mask nickname if user entered full name, or force masking?
            // User asked for "Real nickname few chars + **".
            // We will mask it here if loop logic isn't perfect, but let's assume input is masked or we mask it.
            // Actually best to mask serverside or here.
            // Let's ensure manual input ends with ** or we transform it.
            let finalNickname = nickname.trim()
            if (!finalNickname.includes("*") && finalNickname.length > 3) {
                finalNickname = finalNickname.substring(0, 3) + "**"
            } else if (finalNickname.length <= 3 && !finalNickname.includes("*")) {
                finalNickname = finalNickname + "**"
            }

            const { error } = await supabase.from("reviews").insert({
                user_id: user.id,
                nickname: finalNickname,
                content,
                rating
            })

            if (error) throw error

            setContent("")
            fetchReviews()
        } catch (e) {
            alert("리뷰 등록 실패")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("리뷰를 삭제하시겠습니까?")) return
        try {
            const { error } = await supabase.from("reviews").delete().eq("id", id)
            if (error) throw error
            setReviews(reviews.filter(r => r.id !== id))
        } catch (e) {
            alert("삭제 실패 (권한이 없을 수 있습니다)")
        }
    }

    return (
        <div className="w-full max-w-4xl mx-auto py-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold">고객 후기</h2>
                    <p className="text-muted-foreground mt-2">실제 고객님들의 생생한 이용 후기입니다</p>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold text-xl">
                        <Star className="fill-current" /> 4.9 <span className="text-muted-foreground text-sm font-normal">/ 5.0</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{reviews.length}개의 리뷰</p>
                </div>
            </div>

            {user ? (
                <Card className="mb-8 border-primary/20 bg-muted/30">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="text-xs text-muted-foreground mb-1 block">별점</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <button type="button" key={v} onClick={() => setRating(v)} className="focus:outline-none">
                                                <Star className={`w-6 h-6 ${v <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-400"}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="w-2/3">
                                    <label className="text-xs text-muted-foreground mb-1 block">닉네임</label>
                                    <Input
                                        value={nickname}
                                        onChange={e => setNickname(e.target.value)}
                                        placeholder="표시될 닉네임"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <Textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="이용 후기를 작성해주세요 (비방이나 욕설은 삭제될 수 있습니다)"
                                className="bg-background"
                                minLength={5}
                            />
                            <div className="text-right">
                                <Button type="submit" disabled={isSubmitting}>후기 등록</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="text-center py-6 mb-8 bg-muted/20 rounded-lg">
                    <p className="text-sm text-muted-foreground">후기를 작성하려면 로그인이 필요합니다.</p>
                </div>
            )}

            <div className="grid gap-4">
                {reviews.map(review => (
                    <Card key={review.id} className="bg-card">
                        <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${review.nickname}`} />
                                    <AvatarFallback>{review.nickname[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm">{review.nickname}</span>
                                        <div className="flex text-yellow-500">
                                            {Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={10} className="fill-current" />)}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            {isAdmin && (
                                <button onClick={() => handleDelete(review.id)} className="text-muted-foreground hover:text-red-500">
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <p className="text-sm text-foreground/90 leading-relaxed">{review.content}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
