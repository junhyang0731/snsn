"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export default function MainPopup() {
    const [isOpen, setIsOpen] = useState(false)
    const [popupData, setPopupData] = useState<{ title: string; content: string; image_url?: string } | null>(null)
    const [dontShowAgain, setDontShowAgain] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const checkPopup = async () => {
            // Check local storage for "Dont Show Again" (keyed by date or generic)
            const hiddenUntil = localStorage.getItem("hide_popup_until")
            if (hiddenUntil && new Date(hiddenUntil) > new Date()) {
                return
            }

            // Fetch active popup
            const { data, error } = await supabase
                .from("notices")
                .select("*")
                .eq("is_popup", true)
                .order("created_at", { ascending: false })
                .limit(1)
                .single()

            if (data && !error) {
                setPopupData(data)
                setIsOpen(true)
            }
        }
        checkPopup()
    }, [])

    const handleClose = () => {
        if (dontShowAgain) {
            // Hide for 24 hours
            const tomorrow = new Date()
            tomorrow.setHours(tomorrow.getHours() + 24)
            localStorage.setItem("hide_popup_until", tomorrow.toISOString())
        }
        setIsOpen(false)
    }

    if (!popupData) return null

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
                <DialogHeader className="p-4 bg-secondary/50">
                    <DialogTitle>{popupData.title}</DialogTitle>
                </DialogHeader>

                <div className="p-4 bg-background">
                    {popupData.image_url && (
                        <div className="mb-4 rounded-md overflow-hidden bg-muted/20">
                            <img src={popupData.image_url} alt="Popup" className="w-full h-auto object-cover" />
                        </div>
                    )}
                    <div className="text-sm text-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {popupData.content}
                    </div>
                </div>

                <div className="p-3 bg-secondary/30 flex items-center justify-between border-t border-border">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="dont-show" checked={dontShowAgain} onCheckedChange={(c) => setDontShowAgain(!!c)} />
                        <label
                            htmlFor="dont-show"
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                        >
                            오늘 하루 보지 않기
                        </label>
                    </div>
                    <Button size="sm" onClick={handleClose}>닫기</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
