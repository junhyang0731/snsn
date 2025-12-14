"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
    id: string
    content: string
    is_admin: boolean
    created_at: string
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [user, setUser] = useState<any>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    useEffect(() => {
        if (!user || !isOpen) return

        const fetchMessages = async () => {
            setIsLoading(true)
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: true })

            if (!error && data) {
                setMessages(data)
            }
            setIsLoading(false)
        }

        fetchMessages()

        const channel = supabase
            .channel('chat_user')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as Message])
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user, isOpen, supabase])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, isOpen])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || !user) return

        setIsSending(true)
        try {
            const { error } = await supabase.from("messages").insert({
                user_id: user.id,
                content: inputValue,
                is_admin: false,
            })

            if (error) throw error
            setInputValue("")
        } catch (error) {
            console.error("Failed to send message", error)
        } finally {
            setIsSending(false)
        }
    }

    if (!user) {
        if (isOpen) {
            return (
                <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
                    <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground">
                        <span className="font-semibold">1:1 문의</span>
                        <button onClick={() => setIsOpen(false)}><X size={20} /></button>
                    </div>
                    <div className="p-8 text-center">
                        <p className="text-muted-foreground mb-4">로그인이 필요합니다.</p>
                        <Button onClick={() => window.location.href = '/auth/login'}>로그인 하러가기</Button>
                    </div>
                </div>
            )
        }

        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground hover:scale-110 transition-transform"
            >
                <MessageCircle size={28} />
            </button>
        )
    }

    return (
        <>
            {isOpen ? (
                <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in-20">
                    {/* Header */}
                    <div className="bg-primary p-4 flex justify-between items-center text-primary-foreground shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={20} />
                            <span className="font-semibold">관리자 1:1 문의</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/20 rounded-full p-1 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/30" ref={scrollRef}>
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="animate-spin text-muted-foreground" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                궁금한 점을 물어보세요.<br />친절하게 답변해 드립니다!
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.is_admin ? "justify-start" : "justify-end"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.is_admin
                                                ? "bg-card border border-border text-foreground rounded-tl-none"
                                                : "bg-primary text-primary-foreground rounded-tr-none shadow-sm"
                                            }`}
                                    >
                                        {msg.content}
                                        <div className={`text-[10px] mt-1 opacity-70 ${msg.is_admin ? "text-start" : "text-end"}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-card border-t border-border shrink-0 flex gap-2">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        />
                        <Button type="submit" size="icon" disabled={isSending || !inputValue.trim()} className="rounded-full shadow-sm">
                            <Send size={18} />
                        </Button>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary rounded-full shadow-xl flex items-center justify-center text-primary-foreground hover:scale-110 active:scale-95 transition-all duration-300 group"
                >
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-50" />
                    <MessageCircle size={28} />
                    <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-card border border-border px-3 py-1 rounded-lg text-sm font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-sm">
                        1:1 문의
                    </span>
                </button>
            )}
        </>
    )
}
