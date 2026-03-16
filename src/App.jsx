import { useState } from "react";

const TABS = ["Social Media", "Email Campaign", "Blog / SEO"];

const PLATFORM_ICONS = {
  Twitter: "𝕏",
  LinkedIn: "in",
  Instagram: "◈",
};

function Spinner() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: "16px", padding: "60px 0"
    }}>
      <div style={{
        width: "48px", height: "48px", border: "3px solid #1a1a2e",
        borderTop: "3px solid #e8ff47", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <p style={{ color: "#888", fontSize: "14px", fontFamily: "'DM Mono', monospace" }}>
        Analyzing your brand...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} style={{
      background: copied ? "#e8ff47" : "transparent",
      border: "1px solid " + (copied ? "#e8ff47" : "#333"),
      color: copied ? "#0a0a0f" : "#888",
      padding: "4px 12px", borderRadius: "6px", fontSize: "11px",
      fontFamily: "'DM Mono', monospace", cursor: "pointer",
      transition: "all 0.2s", letterSpacing: "0.05em"
    }}>
      {copied ? "✓ COPIED" : "COPY"}
    </button>
  );
}

function SocialCard({ platform, content }) {
  return (
    <div style={{
      background: "#0f0f1a", border: "1px solid #1e1e32",
      borderRadius: "12px", padding: "20px", marginBottom: "14px",
      transition: "border-color 0.2s"
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#e8ff47"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e1e32"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{
            background: "#e8ff47", color: "#0a0a0f", width: "28px", height: "28px",
            borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: "700"
          }}>{PLATFORM_ICONS[platform]}</span>
          <span style={{ color: "#ccc", fontSize: "13px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
            {platform.toUpperCase()}
          </span>
        </div>
        <CopyButton text={content} />
      </div>
      <p style={{ color: "#e0e0e0", lineHeight: "1.7", fontSize: "14px", margin: 0, whiteSpace: "pre-wrap" }}>{content}</p>
    </div>
  );
}

function EmailCard({ subject, body }) {
  return (
    <div style={{
      background: "#0f0f1a", border: "1px solid #1e1e32",
      borderRadius: "12px", padding: "24px", marginBottom: "14px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <div style={{ color: "#888", fontSize: "11px", fontFamily: "'DM Mono', monospace", marginBottom: "4px", letterSpacing: "0.1em" }}>SUBJECT LINE</div>
          <div style={{ color: "#e8ff47", fontSize: "16px", fontWeight: "600" }}>{subject}</div>
        </div>
        <CopyButton text={`Subject: ${subject}\n\n${body}`} />
      </div>
      <div style={{ height: "1px", background: "#1e1e32", marginBottom: "16px" }} />
      <p style={{ color: "#e0e0e0", lineHeight: "1.8", fontSize: "14px", margin: 0, whiteSpace: "pre-wrap" }}>{body}</p>
    </div>
  );
}

function BlogCard({ title, intro, sections, cta }) {
  return (
    <div style={{
      background: "#0f0f1a", border: "1px solid #1e1e32",
      borderRadius: "12px", padding: "24px", marginBottom: "14px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ flex: 1, paddingRight: "16px" }}>
          <div style={{ color: "#888", fontSize: "11px", fontFamily: "'DM Mono', monospace", marginBottom: "6px", letterSpacing: "0.1em" }}>BLOG TITLE</div>
          <div style={{ color: "#e8ff47", fontSize: "18px", fontWeight: "700", lineHeight: "1.3" }}>{title}</div>
        </div>
        <CopyButton text={`${title}\n\n${intro}\n\n${sections?.map(s => `## ${s.heading}\n${s.body}`).join("\n\n")}\n\n${cta}`} />
      </div>
      <div style={{ height: "1px", background: "#1e1e32", marginBottom: "16px" }} />
      <p style={{ color: "#e0e0e0", lineHeight: "1.8", fontSize: "14px", marginBottom: "16px" }}>{intro}</p>
      {sections?.map((s, i) => (
        <div key={i} style={{ marginBottom: "14px" }}>
          <div style={{ color: "#b0b8ff", fontSize: "14px", fontWeight: "600", marginBottom: "6px" }}>## {s.heading}</div>
          <p style={{ color: "#ccc", lineHeight: "1.7", fontSize: "14px", margin: 0 }}>{s.body}</p>
        </div>
      ))}
      {cta && <div style={{ marginTop: "16px", padding: "14px", background: "#13132a", borderRadius: "8px", borderLeft: "3px solid #e8ff47" }}>
        <p style={{ color: "#e0e0e0", fontSize: "14px", margin: 0, fontStyle: "italic" }}>{cta}</p>
      </div>}
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);

    try {
      // Calls our secure Vercel serverless function (api/generate.js)
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      setResults(data);
    } catch (e) {
      setError("Something went wrong. Please check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a0f", color: "#fff",
      fontFamily: "'Syne', sans-serif", padding: "0"
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #1a1a2e", padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "32px", height: "32px", background: "#e8ff47",
            borderRadius: "8px", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "18px"
          }}>⚡</div>
          <span style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "-0.02em" }}>
            MARKETER<span style={{ color: "#e8ff47" }}>AI</span>
          </span>
        </div>
        <span style={{ color: "#555", fontSize: "12px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>
          PASTE URL → GET FULL CAMPAIGN
        </span>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "60px 24px" }}>

        {/* Hero */}
        {!results && !loading && (
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <div style={{
              display: "inline-block", background: "#13132a", border: "1px solid #1e1e32",
              borderRadius: "100px", padding: "6px 16px", fontSize: "11px",
              fontFamily: "'DM Mono', monospace", color: "#888", letterSpacing: "0.1em", marginBottom: "24px"
            }}>
              ✦ POWERED BY CLAUDE AI
            </div>
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 64px)", fontWeight: "800",
              lineHeight: "1.05", letterSpacing: "-0.03em", margin: "0 0 20px"
            }}>
              Your entire marketing<br />
              <span style={{
                background: "linear-gradient(90deg, #e8ff47, #7affb2)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
              }}>campaign in seconds.</span>
            </h1>
            <p style={{ color: "#666", fontSize: "17px", lineHeight: "1.6", maxWidth: "480px", margin: "0 auto" }}>
              Drop in any company URL. Get scroll-stopping social posts, high-converting emails, and SEO-ready blog content — instantly.
            </p>
          </div>
        )}

        {/* URL Input */}
        <div style={{
          background: "#0f0f1a", border: "1px solid #1e1e32",
          borderRadius: "16px", padding: "6px 6px 6px 20px",
          display: "flex", alignItems: "center", gap: "12px",
          marginBottom: "32px", transition: "border-color 0.2s",
        }}>
          <span style={{ color: "#555", fontSize: "16px" }}>🔗</span>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
            placeholder="https://yourcompany.com"
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "#fff", fontSize: "16px", fontFamily: "'DM Mono', monospace",
              padding: "12px 0"
            }}
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !url.trim()}
            style={{
              background: url.trim() && !loading ? "#e8ff47" : "#1a1a2e",
              color: url.trim() && !loading ? "#0a0a0f" : "#555",
              border: "none", borderRadius: "10px", padding: "14px 28px",
              fontSize: "14px", fontWeight: "700", cursor: url.trim() ? "pointer" : "default",
              fontFamily: "'Syne', sans-serif", letterSpacing: "0.02em",
              transition: "all 0.2s", whiteSpace: "nowrap"
            }}
          >
            {loading ? "Generating..." : "Generate Campaign ⚡"}
          </button>
        </div>

        {error && (
          <div style={{ color: "#ff6b6b", textAlign: "center", marginBottom: "24px", fontSize: "14px" }}>{error}</div>
        )}

        {loading && <Spinner />}

        {/* Results */}
        {results && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }`}</style>

            {/* Brand Summary */}
            <div style={{
              background: "linear-gradient(135deg, #0f0f1a, #13132a)",
              border: "1px solid #1e1e32", borderRadius: "14px",
              padding: "24px", marginBottom: "28px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div>
                <div style={{ color: "#888", fontSize: "11px", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", marginBottom: "6px" }}>CAMPAIGN FOR</div>
                <div style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.02em" }}>{results.companyName}</div>
                <div style={{ color: "#e8ff47", fontSize: "14px", marginTop: "4px", fontStyle: "italic" }}>"{results.tagline}"</div>
              </div>
              <button onClick={() => { setResults(null); setUrl(""); }} style={{
                background: "transparent", border: "1px solid #333",
                color: "#888", padding: "8px 16px", borderRadius: "8px",
                fontSize: "12px", cursor: "pointer", fontFamily: "'DM Mono', monospace"
              }}>← NEW URL</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "#0f0f1a", padding: "4px", borderRadius: "10px", border: "1px solid #1e1e32" }}>
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setActiveTab(i)} style={{
                  flex: 1, padding: "10px", borderRadius: "8px", border: "none",
                  background: activeTab === i ? "#e8ff47" : "transparent",
                  color: activeTab === i ? "#0a0a0f" : "#666",
                  fontSize: "13px", fontWeight: "700", cursor: "pointer",
                  fontFamily: "'Syne', sans-serif", transition: "all 0.15s"
                }}>{t}</button>
              ))}
            </div>

            {activeTab === 0 && (
              <div>
                {Object.entries(results.social || {}).map(([platform, content]) => (
                  <SocialCard key={platform} platform={platform} content={content} />
                ))}
              </div>
            )}

            {activeTab === 1 && results.email && (
              <EmailCard subject={results.email.subject} body={results.email.body} />
            )}

            {activeTab === 2 && results.blog && (
              <BlogCard
                title={results.blog.title}
                intro={results.blog.intro}
                sections={results.blog.sections}
                cta={results.blog.cta}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
