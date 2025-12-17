"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUp, Save, FileCode, FileText } from "lucide-react"

const DEFAULT_TEMPLATE = `안녕하십니까? snacksnake (구 XYON)입니다. 저희 상품을 구매해 주셔서 진심으로 감사드립니다.

--상품 내역 안내--
귀하의 구매 상품: {product_name}
구매 상품 보유 가능 기간: {duration}
인증키: {license_key}
구매 인증: {order_id}

--상품 사용방법--
1. 동봉된 프로그램에 위 "인증키"를 입력하십시오. 
2. 문제 발생 시 support@snsn.shop로 연락 바랍니다.`

export default function AdminDistributionTab() {
    const [videos, setVideos] = useState<any[]>([])
    const [selectedVideo, setSelectedVideo] = useState<any | null>(null)
    const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [baseFileName, setBaseFileName] = useState<string | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchVideos()
    }, [])

    const fetchVideos = async () => {
        const { data } = await supabase.from("videos").select("id, title, thumbnail_url, readme_template, base_file_path").order("created_at", { ascending: false })
        if (data) setVideos(data)
    }

    const handleVideoSelect = (video: any) => {
        setSelectedVideo(video)
        setTemplate(video.readme_template || DEFAULT_TEMPLATE)
        if (video.base_file_path) {
            setBaseFileName(video.base_file_path.split('/').pop())
        } else {
            setBaseFileName(null)
        }
    }

    const handleSaveTemplate = async () => {
        if (!selectedVideo) return
        setIsSaving(true)
        try {
            const { error } = await supabase
                .from('videos')
                .update({ readme_template: template })
                .eq('id', selectedVideo.id)

            if (error) throw error
            alert("템플릿이 저장되었습니다.")
            fetchVideos() // Refresh
        } catch (e: any) {
            alert(`저장 실패: ${e.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedVideo || !e.target.files || e.target.files.length === 0) return

        setIsUploading(true)
        const file = e.target.files[0]
        // Save as 'distribution/VIDEO_ID/base_FILENAME'
        const path = `distribution/${selectedVideo.id}/base_${file.name.replace(/[^a-zA-Z0-9-_\.]/g, '_')}`

        try {
            const { error: uploadError } = await supabase.storage
                .from('product-files')
                .upload(path, file, { upsert: true })

            if (uploadError) throw uploadError

            const { error: dbError } = await supabase
                .from('videos')
                .update({ base_file_path: path })
                .eq('id', selectedVideo.id)

            if (dbError) throw dbError

            setBaseFileName(file.name)
            alert("기본 실행 파일이 업로드되었습니다.")
            fetchVideos()
        } catch (e: any) {
            console.error(e)
            alert(`업로드 실패: ${e.message}`)
        } finally {
            setIsUploading(false)
            e.target.value = ""
        }
    }

    return (
        <div className="space-y-6">
            {!selectedVideo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map(video => (
                        <Card
                            key={video.id}
                            className="cursor-pointer hover:border-primary hover:bg-muted/10 transition-colors"
                            onClick={() => handleVideoSelect(video)}
                        >
                            <CardHeader className="flex flex-row items-center gap-4 p-4">
                                <img src={video.thumbnail_url} className="w-12 h-12 rounded bg-muted object-cover" alt="" />
                                <div>
                                    <CardTitle className="text-base">{video.title}</CardTitle>
                                    <div className="flex gap-2 mt-1">
                                        {video.base_file_path ?
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">파일 등록됨</span> :
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">파일 없음</span>
                                        }
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => setSelectedVideo(null)}>← 목록으로</Button>
                        <h2 className="text-xl font-bold">{selectedVideo.title} 배포 설정</h2>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileCode size={20} />
                                기본 실행 파일 (Loader)
                            </CardTitle>
                            <CardDescription>
                                모든 구매자에게 제공될 공통 실행 파일입니다. (ZIP에 포함됨)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4 border p-4 rounded-lg bg-secondary/10">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <FileUp size={24} className="text-primary" />
                                </div>
                                <div className="flex-1">
                                    {baseFileName ? (
                                        <p className="font-medium text-green-600">현재 파일: {baseFileName}</p>
                                    ) : (
                                        <p className="text-muted-foreground">등록된 파일이 없습니다.</p>
                                    )}
                                </div>
                                <Label htmlFor="base-file-upload" className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium">
                                    <FileUp size={16} />
                                    {isUploading ? "업로드 중..." : "파일 업로드"}
                                </Label>
                                <Input
                                    id="base-file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText size={20} />
                                Readme.txt 템플릿
                            </CardTitle>
                            <CardDescription>
                                ZIP 파일에 포함될 안내문입니다. <code>{`{변수명}`}</code>은 자동 치환됩니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-xs text-muted-foreground flex gap-2 mb-2 p-2 bg-secondary rounded flex-wrap">
                                치환 변수:
                                <span className="font-mono bg-background px-1 rounded">{`{product_name}`}</span>
                                <span className="font-mono bg-background px-1 rounded">{`{license_key}`}</span>
                                <span className="font-mono bg-background px-1 rounded">{`{duration}`}</span>
                                <span className="font-mono bg-background px-1 rounded">{`{order_id}`}</span>
                            </div>

                            <Textarea
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                rows={15}
                                className="font-mono text-sm leading-relaxed"
                            />

                            <Button onClick={handleSaveTemplate} disabled={isSaving} className="w-full">
                                <Save size={16} className="mr-2" />
                                {isSaving ? "저장 중..." : "템플릿 저장"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
