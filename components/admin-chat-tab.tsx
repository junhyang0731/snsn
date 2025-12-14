"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, User as UserIcon, Loader2 } from "lucide-react"

interface Message {
    id: string
    user_id: string
    content: string
    is_admin: boolean
    created_at: string
    is_read: boolean
}

interface ChatUser {
    id: string
    email: string
    lastMessage: string
    lastMessageTime: string
    unreadCount?: number
}

export default function AdminChatTab() {
    const [activeUserId, setActiveUserId] = useState<string | null>(null)
    const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const scrollRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchChatUsers()

        // Subscribe to all messages
        const channel = supabase
            .channel('admin_chat_global')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    handleNewMessage(payload.new as Message)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    useEffect(() => {
        if (activeUserId) {
            fetchMessages(activeUserId)
        }
    }, [activeUserId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const fetchChatUsers = async () => {
        setIsLoading(true)
        try {
            // Fetch all messages to group by user (Optimization needed for production)
            const { data: allMessages, error } = await supabase
                .from("messages")
                .select("user_id, content, created_at, is_read")
                .order("created_at", { ascending: false })

            if (error) throw error
            if (!allMessages) return

            const usersMap = new Map<string, ChatUser>()

            // Get unique User IDs
            const userIds = Array.from(new Set(allMessages.map(m => m.user_id)))

            // Fetch Profiles
            const { data: profiles } = await supabase
                .from("profiles")
                .select("id, email")
                .in("id", userIds)

            const profileMap = new Map(profiles?.map(p => [p.id, p]))

            allMessages.forEach(msg => {
                if (!usersMap.has(msg.user_id)) {
                    const profile = profileMap.get(msg.user_id)
                    usersMap.set(msg.user_id, {
                        id: msg.user_id,
                        email: profile?.email || "Unknown User",
                        lastMessage: msg.content,
                        lastMessageTime: msg.created_at,
                        unreadCount: 0
                    })
                }
                // simplistic unread logic could go here
            })

            setChatUsers(Array.from(usersMap.values()))
        } catch (error) {
            console.error("Error fetching users:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleNewMessage = (msg: Message) => {
        // Update Users List (Bump to top)
        setChatUsers(prev => {
            const others = prev.filter(u => u.id !== msg.user_id)
            const target = prev.find(u => u.id === msg.user_id)

            // Need to fetch email if new user
            const updatedUser = target ? {
                ...target,
                lastMessage: msg.content,
                lastMessageTime: msg.created_at
            } : {
                id: msg.user_id,
                email: "New User (Refresh)", // Simplification
                lastMessage: msg.content,
                lastMessageTime: msg.created_at,
                unreadCount: 1
            }

            return [updatedUser, ...others]
        })

        // If active chat
        if (activeUserId === msg.user_id) {
            setMessages(prev => [...prev, msg])
        }
    }

    const fetchMessages = async (userId: string) => {
        const { data } = await supabase
            .from("messages")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })

        if (data) setMessages(data)
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !activeUserId) return

        try {
            await supabase.from("messages").insert({
                user_id: activeUserId,
                content: input,
                is_admin: true
            })
            setInput("")
        } catch (error) {
            console.error("Failed to send", error)
        }
    }

    return (
        <div className="flex bg-card border border-border rounded-xl overflow-hidden h-[600px] shadow-sm">
            {/* Sidebar: User List */}
            <div className="w-80 border-r border-border flex flex-col bg-secondary/10">
                <div className="p-4 border-b border-border bg-card">
                    <h3 className="font-semibold text-lg">채팅 목록</h3>
                </div>
                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="p-4"><Loader2 className="animate-spin" /></div>
                    ) : (
                        chatUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => setActiveUserId(user.id)}
                                className={`w-full text-left p-4 border-b border-border/50 hover:bg-accent/50 transition-colors ${activeUserId === user.id ? "bg-accent text-accent-foreground" : ""
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback><UserIcon size={16} /></AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium truncate">{user.email}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.lastMessage}</p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                        {new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-card">
                {activeUserId ? (
                    <>
                        <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/10">
                            <span className="font-semibold">{chatUsers.find(u => u.id === activeUserId)?.email}</span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.is_admin ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${msg.is_admin
                                            ? "bg-primary text-primary-foreground rounded-tr-none"
                                            : "bg-secondary text-secondary-foreground rounded-tl-none border border-border"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 border-t border-border flex gap-2">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="답변 입력..."
                                className="flex-1"
                            />
                            <Button type="submit" size="icon"><Send size={18} /></Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        채팅을 선택하세요
                    </div>
                )}
            </div>
        </div>
    )
}
