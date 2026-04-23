import { useState, useRef } from "react";

/* â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const PLATFORMS = ["LinkedIn", "Instagram", "Twitter", "Facebook"];
const LANGUAGES = ["English", "Hindi", "Hinglish", "Bengali", "Tamil"];
const AUDIENCES = ["General Public", "Students", "Professionals", "Entrepreneurs", "Youth", "Creators"];

const PLATFORM_COLORS = {
  LinkedIn: "#0A66C2",
  Instagram: "#E1306C",
  Twitter: "#1DA1F2",
  Facebook: "#1877F2",
};

const PLATFORM_ICONS = {
  LinkedIn: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
  Instagram: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  ),
  Twitter: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  Facebook: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  ),
};

/* â”€â”€â”€ Small reusable components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

function SparkleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" />
    </svg>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handle} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "5px 13px", borderRadius: 8,
      background: copied ? "#dcfce7" : "#f5f3ff",
      color: copied ? "#16a34a" : "#7c3aed",
      border: `1px solid ${copied ? "#bbf7d0" : "#ede8ff"}`,
      cursor: "pointer", fontSize: 11, fontWeight: 700,
      fontFamily: "'Sora', sans-serif",
      transition: "all 0.2s",
    }}>
      {copied
        ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
        : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
      }
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function PlatformPill({ platform, active, onClick }) {
  const color = PLATFORM_COLORS[platform];
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        borderRadius: 999, padding: "7px 15px",
        fontSize: 12, fontWeight: 700,
        fontFamily: "'Sora', sans-serif",
        border: active ? `1.5px solid ${color}` : "1.5px solid #e0d8ff",
        background: active ? color : "#fff",
        color: active ? "#fff" : "#aaa",
        cursor: "pointer",
        transition: "all 0.18s ease",
      }}
    >
      {PLATFORM_ICONS[platform]}
      {platform}
    </button>
  );
}

function LangPill({ lang, active, locked, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={locked}
      style={{
        borderRadius: 999, padding: "7px 15px",
        fontSize: 12, fontWeight: 700,
        fontFamily: "'Sora', sans-serif",
        border: active ? "1.5px solid #7c3aed" : "1.5px solid #e0d8ff",
        background: active ? "#7c3aed" : "#fff",
        color: active ? "#fff" : "#aaa",
        cursor: locked ? "default" : "pointer",
        transition: "all 0.18s ease",
        opacity: locked ? 0.6 : 1,
      }}
    >
      {lang}
    </button>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#fff",
          display: "inline-block",
          animation: `pcdot 1.1s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
    </span>
  );
}

function PostCard({ platform, text, delay = 0 }) {
  const color = PLATFORM_COLORS[platform];
  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: `1.5px solid ${color}20`,
      padding: "18px 20px", marginBottom: 14,
      position: "relative", overflow: "hidden",
      boxShadow: `0 2px 16px ${color}0d`,
      animation: `pcslide 0.45s ease both`,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0,
        width: 3, height: "100%", background: color, borderRadius: 0,
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color, fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12 }}>
          {PLATFORM_ICONS[platform]}
          {platform}
        </div>
        <CopyButton text={text} />
      </div>
      <p style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 13.5, lineHeight: 1.78, color: "#2d2d2d", whiteSpace: "pre-wrap" }}>
        {text}
      </p>
    </div>
  );
}

function TranslationCard({ lang, text, delay = 0 }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: "1.5px solid #fde68a",
      padding: "18px 20px", marginBottom: 14,
      position: "relative", overflow: "hidden",
      boxShadow: "0 2px 16px #f59e0b0d",
      animation: `pcslide 0.45s ease both`,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#f59e0b", borderRadius: 0 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#b45309", fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
          {lang} version
        </div>
        <CopyButton text={text} />
      </div>
      <p style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 13.5, lineHeight: 1.78, color: "#78350f", whiteSpace: "pre-wrap" }}>{text}</p>
    </div>
  );
}

function AssetTextCard({ title, eyebrow, text, accent = "#7c3aed", delay = 0 }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: "1.5px solid #e8e0ff",
      padding: "18px 20px", marginBottom: 14,
      boxShadow: "0 2px 16px #7c3aed08",
      animation: `pcslide 0.45s ease both`,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: accent, fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          {title}
        </div>
        <CopyButton text={text} />
      </div>
      <div style={{
        background: "#faf7ff", border: "1.5px dashed #c4b5fd",
        borderRadius: 12, padding: "22px 18px",
      }}>
        <p style={{ margin: "0 0 8px", fontSize: 11, color: "#7c3aed", fontFamily: "'Sora',sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {eyebrow}
        </p>
        <p style={{ margin: 0, fontFamily: "'Lora',serif", fontSize: 13.5, fontStyle: "italic", color: "#4c1d95", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
          "{text}"
        </p>
      </div>
    </div>
  );
}

function ListCard({ title, items = [], accent = "#0f766e", delay = 0 }) {
  const text = items.map((item, index) => `${index + 1}. ${item}`).join("\n");
  return (
    <div style={{
      background: "#fff", borderRadius: 18,
      border: "1.5px solid #d1fae5",
      padding: "18px 20px", marginBottom: 14,
      boxShadow: "0 2px 16px #0f766e0d",
      animation: `pcslide 0.45s ease both`,
      animationDelay: `${delay}ms`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, color: accent, fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
          {title}
        </div>
        <CopyButton text={text} />
      </div>
      <div style={{ display: "grid", gap: 9 }}>
        {items.map((item, index) => (
          <div key={`${title}-${index}`} style={{
            background: "#f0fdfa",
            border: "1px solid #ccfbf1",
            borderRadius: 11,
            padding: "10px 12px",
            fontFamily: "'Lora',serif",
            fontSize: 13,
            lineHeight: 1.55,
            color: "#134e4a",
          }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

/* â”€â”€â”€ Main App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function PostCraftAI() {
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("General Public");
  const [platforms, setPlatforms] = useState(["LinkedIn", "Instagram", "Twitter", "Facebook"]);
  const [languages, setLanguages] = useState(["English", "Hindi", "Hinglish", "Bengali", "Tamil"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const outputRef = useRef(null);

  const togglePlatform = (p) => {
    if (platforms.includes(p)) {
      if (platforms.length === 1) return;
      setPlatforms(platforms.filter(x => x !== p));
    } else {
      setPlatforms([...platforms, p]);
    }
  };

  const toggleLang = (l) => {
    if (languages.includes(l)) {
      if (languages.length === 1) return; // Keep at least one language
      setLanguages(languages.filter(x => x !== l));
    } else {
      setLanguages([...languages, l]);
    }
  };

  const generate = async () => {
    if (!topic.trim()) { setError("Please enter a topic to continue."); return; }
    if (platforms.length === 0) { setError("Please select at least one platform."); return; }
    if (languages.length === 0) { setError("Please select at least one language."); return; }
    setError("");
    setLoading(true);
    setResult(null);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiBaseUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, audience, platforms, languages }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "API Error");
      }
      const data = await res.json();
      // Support responses keyed by data/data as well as direct JSON body.
      const payload = data?.data ? data.data : data;
      setResult({
        content: payload.content || {},
        translations: payload.translations || {},
        hashtags: payload.hashtags || [],
        image_prompt: payload.image_prompt || payload.imagePrompt || "",
        design_brief: payload.design_brief || payload.designBrief || "",
        cta_suggestions: payload.cta_suggestions || payload.ctaSuggestions || [],
        posting_tips: payload.posting_tips || payload.postingTips || [],
        spelling: payload.spelling || {},
      });
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Check your API connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTopic("");
    setPlatforms(["LinkedIn", "Instagram", "Twitter", "Facebook"]);
    setLanguages(["English", "Hindi", "Hinglish", "Bengali", "Tamil"]);
    setAudience("General Public");
    setError("");
  };

  const totalPosts = result
    ? (platforms.filter(p => result.content?.[p]).length) +
      (languages.filter(l => l !== "English" && result.translations?.[l]).length)
    : 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f4f1ff; font-family: 'Sora', sans-serif; }

        @keyframes pcdot {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes pcslide {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pcfade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .pc-topbar {
          position: sticky; top: 0; z-index: 100;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #ede8ff;
          height: 58px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px;
        }
        .pc-hero {
          background: #ede8ff;
          text-align: center;
          padding: 52px 24px 40px;
          border-bottom: 1px solid #ddd6fe;
        }
        .pc-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 28px 20px 80px;
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 26px;
          align-items: start;
        }
        @media (max-width: 800px) {
          .pc-main { grid-template-columns: 1fr; }
          .pc-hero h1 { font-size: 26px !important; }
        }

        .pc-input-card {
          background: #fff;
          border-radius: 22px;
          border: 1.5px solid #ede8ff;
          padding: 28px 26px;
          box-shadow: 0 4px 32px rgba(124,58,237,0.06);
          position: sticky;
          top: 78px;
        }

        .pc-field { margin-bottom: 20px; }
        .pc-label {
          display: block;
          font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.09em;
          color: #999; margin-bottom: 8px;
        }
        .pc-input {
          width: 100%;
          background: #faf8ff;
          border: 1.5px solid #ede8ff;
          border-radius: 13px;
          padding: 13px 16px;
          font-size: 14px; font-family: 'Lora', serif;
          color: #1a1a2e; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pc-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
        }
        .pc-select {
          width: 100%;
          background: #faf8ff;
          border: 1.5px solid #ede8ff;
          border-radius: 13px;
          padding: 12px 16px;
          font-size: 13px; font-family: 'Sora', sans-serif;
          color: #1a1a2e; outline: none; cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%237c3aed' stroke-width='1.8' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
          transition: border-color 0.2s;
        }
        .pc-select:focus { border-color: #7c3aed; }

        .pc-pills { display: flex; flex-wrap: wrap; gap: 8px; }

        .pc-genbtn {
          width: 100%;
          background: #7c3aed;
          color: #fff; border: none;
          border-radius: 14px; padding: 15px 20px;
          font-size: 15px; font-weight: 700;
          font-family: 'Sora', sans-serif;
          cursor: pointer; letter-spacing: -0.2px;
          display: flex; align-items: center; justify-content: center; gap: 9px;
          box-shadow: 0 5px 20px rgba(124,58,237,0.38);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          margin-top: 4px;
        }
        .pc-genbtn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(124,58,237,0.45);
        }
        .pc-genbtn:active:not(:disabled) { transform: translateY(0); }
        .pc-genbtn:disabled { opacity: 0.75; cursor: not-allowed; }

        .pc-flow {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-top: 16px;
        }
        .pc-flow-step { font-size: 9.5px; font-weight: 700; color: #ccc; text-transform: uppercase; letter-spacing: 0.07em; }
        .pc-flow-arrow { font-size: 11px; color: #ddd; }

        .pc-err { font-size: 12px; color: #e11d48; margin-top: 6px; font-family: 'Sora',sans-serif; }

        .pc-out-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 18px; flex-wrap: wrap; gap: 10px;
        }
        .pc-out-title { font-size: 17px; font-weight: 700; color: #1a1a2e; }
        .pc-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .pc-tag {
          font-size: 10px; font-weight: 700; color: #7c3aed;
          background: rgba(124,58,237,0.09);
          border-radius: 999px; padding: 3px 10px;
          border: 1px solid rgba(196,181,253,0.5);
        }

        .pc-summary {
          background: rgba(124,58,237,0.05);
          border-radius: 14px; border: 1.5px solid #ede8ff;
          padding: 14px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 10px;
          animation: pcfade 0.4s ease both;
        }
        .pc-stats { display: flex; gap: 16px; align-items: center; }
        .pc-stat { font-size: 12px; font-weight: 700; color: #7c3aed; }
        .pc-divider { width: 1px; height: 14px; background: #ddd6fe; }
        .pc-newbtn {
          background: #fff; border: 1.5px solid #c4b5fd;
          border-radius: 9px; padding: 6px 16px;
          font-size: 11px; font-weight: 700; color: #7c3aed;
          cursor: pointer; font-family: 'Sora',sans-serif;
          transition: background 0.15s;
        }
        .pc-newbtn:hover { background: #f5f3ff; }

        .pc-empty {
          background: #fff;
          border-radius: 22px;
          border: 1.5px dashed #ddd6fe;
          padding: 60px 30px;
          text-align: center;
          animation: pcfade 0.4s ease;
        }
      `}</style>

      {/* â”€â”€ Topbar â”€â”€ */}
      <nav className="pc-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: "#7c3aed",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <SparkleIcon size={17} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 17, color: "#1a1a2e", letterSpacing: "-0.4px" }}>
            PostCraft AI
          </span>
        </div>
        <span style={{
          fontSize: 11, color: "#999", fontWeight: 600,
          background: "#f5f3ff", border: "1px solid #ede8ff",
          borderRadius: 999, padding: "4px 14px",
        }}>
          Powered by Groq
        </span>
      </nav>

      {/* â”€â”€ Hero â”€â”€ */}
      <div className="pc-hero">
        <div style={{
          display: "inline-block",
          background: "rgba(124,58,237,0.1)",
          color: "#7c3aed",
          borderRadius: 999, padding: "4px 16px",
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          marginBottom: 16, border: "1px solid rgba(196,181,253,0.5)",
        }}>
          AI Content Generator
        </div>
        <h1 style={{
          fontSize: 38, fontWeight: 800, color: "#1a1a2e",
          letterSpacing: "-1.2px", lineHeight: 1.15, marginBottom: 12,
        }}>
          Topic in.{" "}
          <span style={{ color: "#7c3aed" }}>Ready posts out.</span>
        </h1>
        <p style={{ fontSize: 14.5, color: "#666", maxWidth: 420, margin: "0 auto", lineHeight: 1.65 }}>
          Generate platform captions, translations, hashtags, image prompts, CTAs, and posting tips in seconds.
        </p>
      </div>

      {/* â”€â”€ Main grid â”€â”€ */}
      <div className="pc-main">

        {/* â”€â”€ Input Card â”€â”€ */}
        <div className="pc-input-card">
          <p style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", marginBottom: 22 }}>Create content</p>

          {/* Topic */}
          <div className="pc-field">
            <span className="pc-label">Topic *</span>
            <input
              className="pc-input"
              placeholder="e.g. Ram Navami wishes, Product launch, Diwali sale..."
              value={topic}
              onChange={e => { setTopic(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && generate()}
            />
            {error && <p className="pc-err">{error}</p>}
          </div>

          {/* Audience */}
          <div className="pc-field">
            <span className="pc-label">Audience</span>
            <select className="pc-select" value={audience} onChange={e => setAudience(e.target.value)}>
              {AUDIENCES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          {/* Platforms */}
          <div className="pc-field">
            <span className="pc-label">
              Platforms{" "}
              <span style={{ textTransform: "none", fontWeight: 500, color: "#ccc", fontSize: 9 }}>
                (select all that apply)
              </span>
            </span>
            <div className="pc-pills">
              {PLATFORMS.map(p => (
                <PlatformPill
                  key={p} platform={p}
                  active={platforms.includes(p)}
                  onClick={() => togglePlatform(p)}
                />
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="pc-field">
            <span className="pc-label">
              Languages{" "}
              <span style={{ textTransform: "none", fontWeight: 500, color: "#ccc", fontSize: 9 }}>
                (English always included)
              </span>
            </span>
            <div className="pc-pills">
              {LANGUAGES.map(l => (
                <LangPill
                  key={l} lang={l}
                  active={languages.includes(l)}
                  locked={false}
                  onClick={() => toggleLang(l)}
                />
              ))}
            </div>
          </div>

          {/* Generate btn */}
          <button className="pc-genbtn" onClick={generate} disabled={loading}>
            {loading ? (
              <><LoadingDots /><span style={{ marginLeft: 4 }}>Generating...</span></>
            ) : (
              <><SparkleIcon size={16} /> Generate Content</>
            )}
          </button>

          {/* Flow hint */}
          <div className="pc-flow">
            {["Topic", "->", "Groq Agent", "->", "Content Kit"].map((s, i) => (
              <span key={i} className={s === "->" ? "pc-flow-arrow" : "pc-flow-step"}>{s}</span>
            ))}
          </div>
        </div>

        {/* â”€â”€ Output Panel â”€â”€ */}
        <div ref={outputRef}>
          {!result && !loading && (
            <div className="pc-empty">
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: "#f5f3ff", margin: "0 auto 16px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <SparkleIcon size={26} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e", marginBottom: 6 }}>
                Your content will appear here
              </p>
              <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>
                Fill in the form and click Generate to create platform-ready posts instantly.
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Spelling correction alert */}
              {result.spelling && !result.spelling.is_correct && (
                <div style={{
                  background: "#fef3c7",
                  border: "1.5px solid #fbbf24",
                  borderRadius: 16,
                  padding: "14px 18px",
                  marginBottom: 18,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: "#92400e", fontFamily: "'Sora',sans-serif" }}>
                      Spelling Correction Applied
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "#b45309", fontFamily: "'Sora',sans-serif" }}>
                      "{result.spelling.original}" {"->"} "{result.spelling.corrected}"
                      {result.spelling.misspelled_words?.length > 0 && ` (Corrected: ${result.spelling.misspelled_words.join(", ")})`}
                    </p>
                  </div>
                </div>
              )}

              {/* Header with hashtags */}
              <div className="pc-out-head">
                <span className="pc-out-title">Your content</span>
                <div className="pc-tags">
                  {result.hashtags?.slice(0, 5).map(h => (
                    <span key={h} className="pc-tag">#{h}</span>
                  ))}
                </div>
              </div>

              {/* Platform posts */}
              {platforms.map((p, i) =>
                result.content?.[p] ? (
                  <PostCard key={p} platform={p} text={result.content[p]} delay={i * 60} />
                ) : null
              )}

              {/* Translations */}
              {languages.filter(l => l !== "English").map((l, i) => {
                const translationText = result.translations?.[l];
                return translationText ? (
                  <TranslationCard key={l} lang={l} text={typeof translationText === 'string' ? translationText : JSON.stringify(translationText)} delay={(platforms.length + i) * 60} />
                ) : null;
              })}

              {/* Creative kit */}
              <AssetTextCard
                title="Copy-paste image prompt"
                eyebrow="Paste into ChatGPT, DALL-E, Canva, Leonardo, or Bing Image Creator"
                text={result.image_prompt}
                delay={(platforms.length + languages.length) * 60}
              />

              <AssetTextCard
                title="Design brief"
                eyebrow="Use this for Canva, Figma, or manual design"
                text={result.design_brief}
                accent="#b45309"
                delay={(platforms.length + languages.length + 1) * 60}
              />

              <ListCard
                title="CTA suggestions"
                items={result.cta_suggestions}
                delay={(platforms.length + languages.length + 2) * 60}
              />

              <ListCard
                title="Posting tips"
                items={result.posting_tips}
                accent="#2563eb"
                delay={(platforms.length + languages.length + 3) * 60}
              />

              {/* Summary bar */}
              <div className="pc-summary">
                <div className="pc-stats">
                  <span className="pc-stat">{platforms.filter(p => result.content?.[p]).length} posts</span>
                  <div className="pc-divider" />
                  <span className="pc-stat">
                    {languages.filter(l => l !== "English" && result.translations?.[l]).length + 1} languages
                  </span>
                  <div className="pc-divider" />
                  <span className="pc-stat">{totalPosts} total entries</span>
                  <div className="pc-divider" />
                  <span className="pc-stat">4 creative assets</span>
                </div>
                <button className="pc-newbtn" onClick={reset}>+ New post</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}


