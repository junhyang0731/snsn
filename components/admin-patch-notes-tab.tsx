"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, History } from "lucide-react"

interface PatchNote {
    id: string
    version: string
    content: string
    created_at: string
}

export default function AdminPatchNotesTab() {
    const [notes, setNotes] = useState<PatchNote[]>([])
    const [version, setVersion] = useState("")
    const [content, setContent] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchNotes()
    }, [])

    const fetchNotes = async () => {
        const { data } = await supabase
            .from("patch_notes")
            .select("*")
            .order("created_at", { ascending: false })
        if (data) setNotes(data)
    }

    const handleAddStart = async () => {
        if (!version || !content) return alert("버전과 내용을 입력해주세요.")

        setIsLoading(true)
        const { data, error } = await supabase
            .from("patch_notes")
            .insert({ version, content })
            .select()
            .single()

        if (error) {
            console.error(error)
            alert("저장 실패")
        } else {
            setNotes([data, ...notes])
            setVersion("")
            setContent("")
        }
        setIsLoading(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("삭제하시겠습니까?")) return
        await supabase.from("patch_notes").delete().eq("id", id)
        setNotes(notes.filter(n => n.id !== id))
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus size={20} /> 새 패치노트 작성
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-1/4">
                            <Input
                                placeholder="버전 (예: v2.30)"
                                value={version}
                                onChange={e => setVersion(e.target.value)}
                            />
                        </div>
                        <div className="flex-1">
                            <Textarea
                                placeholder="추가된 기능이나 수정 사항을 입력하세요..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="h-24 resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleAddStart} disabled={isLoading}>
                            {isLoading ? "저장 중..." : "등록하기"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <History size={20} /> 히스토리
                </h3>
                {notes.length === 0 ? (
                    <div className="text-muted-foreground text-center py-8 border rounded-lg bg-muted/10">
                        기록된 패치노트가 없습니다.
                    </div>
                ) : (
                    notes.map(note => (
                        <Card key={note.id} className="overflow-hidden">
                            <div className="flex">
                                <div className="bg-primary/10 w-32 p-4 flex flex-col justify-center items-center border-r">
                                    <span className="font-bold text-lg text-primary">{note.version}</span>
                                    <span className="text-xs text-muted-foreground mt-1">
                                        {new Date(note.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex-1 p-4 whitespace-pre-wrap flex items-center">
                                    {note.content}
                                </div>
                                <div className="p-4 flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(note.id)} className="text-muted-foreground hover:text-red-500">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
