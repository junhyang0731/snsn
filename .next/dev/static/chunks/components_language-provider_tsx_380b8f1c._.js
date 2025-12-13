(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/language-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LanguageProvider",
    ()=>LanguageProvider,
    "useLanguage",
    ()=>useLanguage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
const translations = {
    ko: {
        "nav.all": "모든 제품",
        "nav.notices": "공지사항",
        "nav.reviews": "고객 후기",
        "hero.title": "최고의 발로란트 치트 & 스크립트",
        "hero.desc": "안전하고 강력한 기능으로 랭크를 지배하세요. 에임봇, ESP, 월핵 등 다양한 기능을 제공합니다.",
        "login": "로그인",
        "signup": "회원가입",
        "dashboard": "대시보드",
        "logout": "로그아웃",
        "footer.desc": "압도적인 성능의 발로란트 치트 플랫폼.",
        "footer.support": "고객 지원",
        "footer.faq": "FAQ",
        "footer.contact": "문의하기",
        "footer.refund": "환불 정책",
        "footer.info": "정보",
        "footer.privacy": "개인정보 보호",
        "footer.terms": "이용 약관",
        "footer.payment": "결제 방법",
        "review.title": "고객 후기",
        "review.subtitle": "실제 고객님들의 생생한 이용 후기입니다",
        "loading": "로딩 중...",
        "popup.today": "오늘 하루 보지 않기",
        "popup.close": "닫기"
    },
    en: {
        "nav.all": "All Products",
        "nav.notices": "Notices",
        "nav.reviews": "Reviews",
        "hero.title": "Best Valorant Cheats & Scripts",
        "hero.desc": "Dominate the rank with safe and powerful features. Aimbot, ESP, Wallhack and more.",
        "login": "Login",
        "signup": "Sign Up",
        "dashboard": "Dashboard",
        "logout": "Log Out",
        "footer.desc": "High performance Valorant cheat platform.",
        "footer.support": "Support",
        "footer.faq": "FAQ",
        "footer.contact": "Contact Us",
        "footer.refund": "Refund Policy",
        "footer.info": "Information",
        "footer.privacy": "Privacy Policy",
        "footer.terms": "Terms of Use",
        "footer.payment": "Payment Methods",
        "review.title": "Customer Reviews",
        "review.subtitle": "Real reviews from our customers",
        "loading": "Loading...",
        "popup.today": "Don't show again today",
        "popup.close": "Close"
    }
};
const LanguageContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function LanguageProvider({ children }) {
    _s();
    const [lang, setLang] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("ko");
    const toggleLang = ()=>{
        setLang((prev)=>prev === "ko" ? "en" : "ko");
    };
    const t = (key)=>{
        return translations[lang][key] || key;
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguageContext.Provider, {
        value: {
            lang,
            toggleLang,
            setLang,
            t
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/components/language-provider.tsx",
        lineNumber: 81,
        columnNumber: 9
    }, this);
}
_s(LanguageProvider, "AMox8Irbt21Cf/YaJ/1J96Q+hrM=");
_c = LanguageProvider;
const useLanguage = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LanguageContext);
    if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
    return context;
};
_s1(useLanguage, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "LanguageProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_language-provider_tsx_380b8f1c._.js.map