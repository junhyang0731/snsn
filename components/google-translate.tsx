"use client"

import { useEffect } from "react"
import { setCookie, getCookie } from "cookies-next" // We might not need this if we rely on DOM
// We will use native DOM manipulation for Google Translate

declare global {
    interface Window {
        google: any
        googleTranslateElementInit: any
    }
}

export default function GoogleTranslate() {
    useEffect(() => {
        // Prevent duplicate script injection
        if (document.querySelector("#google-translate-script")) return

        const addScript = document.createElement("script")
        addScript.id = "google-translate-script"
        addScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        document.body.appendChild(addScript)

        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "ko",
                    includedLanguages: "ko,en", // Add more codes if needed: "ko,en,ja,zh-CN"
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                },
                "google_translate_element"
            )
        }
    }, [])

    return (
        <>
            <div id="google_translate_element" className="fixed bottom-0 right-0 z-50 opacity-0 pointer-events-none" />
            <style jsx global>{`
        /* Hide Google Translate Top Bar */
        .goog-te-banner-frame.skiptranslate {
            display: none !important;
        } 
        body {
            top: 0px !important; 
        }
        /* Hide Google Tooltip */
        .goog-tooltip {
            display: none !important;
        }
        .goog-tooltip:hover {
            display: none !important;
        }
        .goog-text-highlight {
            background-color: transparent !important;
            border: none !important; 
            box-shadow: none !important;
        }
      `}</style>
        </>
    )
}
