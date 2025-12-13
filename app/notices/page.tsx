"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Notice {
    id: string
    title: string
    content: string
    created_at: string
    image_url?: string
}

export default function NoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([])
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchNotices = async () => {
            try {
                const { data, error } = await supabase
                    .from("notices")
                    .select("*")
                    .order("created_at", { ascending: false })

                if (error) throw error
                setNotices(data || [])
            } catch (e) {
                console.error("Failed to load notices", e)
            } finally {
                setIsLoading(false)
            }
        }
        fetchNotices()
    }, [])

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id)
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8">공지사항</h1>

                {isLoading ? (
                    <div className="text-center py-12">로딩 중...</div>
                ) : notices.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-lg">
                        등록된 공지사항이 없습니다.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notices.map((notice) => (
                            <Card key={notice.id} className="overflow-hidden bg-secondary border-border cursor-pointer transition-colors hover:bg-secondary/80" onClick={() => toggleExpand(notice.id)}>
                                <CardHeader className="p-4 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{notice.title}</CardTitle>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(notice.created_at).toLocaleDateString("ko-KR")}
                                        </p>
                                    </div>
                                    {expandedId === notice.id ? <ChevronUp className="text-muted-foreground" /> : <ChevronDown className="text-muted-foreground" />}
                                </CardHeader>
                                {expandedId === notice.id && (
                                    <CardContent className="p-4 pt-0 border-t border-border/50 bg-background/50">
                                        <div className="pt-4 whitespace-pre-wrap text-sm leading-relaxed">
                                            {notice.content}
                                        </div>
                                        {notice.image_url && (
                                            <div className="mt-4">
                                                <img src={notice.image_url} alt="Notice" className="max-w-full rounded-lg border border-border" />
                                            </div>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    )
}
