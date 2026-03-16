export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── STEP 1: Scrape the website using multiple strategies ──
  let siteContent = "";

  // Strategy A: fetch via a CORS-friendly proxy that returns raw text
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(9000) });
      if (!r.ok) continue;
      const json = await r.json().catch(() => null);
      const html = json?.contents || (await r.text());
      if (html && html.length > 200) {
        siteContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 5000);
        break;
      }
    } catch (e) {
      console.warn("Proxy failed:", proxyUrl, e.message);
    }
  }

  // Strategy B: direct fetch fallback
  if (!siteContent) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        signal: AbortSignal.timeout(8000),
      });
      const html = await r.text();
      siteContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5000);
    } catch (e) {
      console.warn("Direct fetch failed:", e.message);
    }
  }

  // ── STEP 2: Generate campaign with Claude ──
  const contextSection = siteContent
    ? `Here is the actual scraped text from their website — use it to understand exactly what they do:\n\n"""\n${siteContent}\n"""\n\nBase your entire campaign on this real content. Be specific — use real product names, real features, real audience language found in the text above.`
    : `We could not scrape the website directly. Use your knowledge of this URL/domain to infer what the company does: ${url}. Be as specific as possible.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `You are a world-class marketing strategist and copywriter.

${contextSection}

Now generate a complete, highly specific marketing campaign. Every line must reference the company's ACTUAL offerings — no generic filler phrases like "innovative solutions" or "world-class service". Use specific product names, real features, concrete benefits.

Return ONLY valid JSON — no markdown fences, no explanation — in this exact structure:

{
  "companyName": "exact company name",
  "tagline": "specific punchy tagline based on what they actually do",
  "social": {
    "Twitter": "Punchy tweet under 280 chars with 2-3 hashtags. Name the actual product/service.",
    "LinkedIn": "150-200 word professional post. Open with a specific insight or stat. Name real features. End with a question.",
    "Instagram": "100-130 word caption with relevant emojis and 5 niche hashtags. Reference specific use cases."
  },
  "email": {
    "subject": "Subject line under 60 chars referencing their specific offer",
    "body": "200-250 word email. Hook, 2-3 benefit paragraphs naming real features, CTA in [brackets], P.S. line."
  },
  "blog": {
    "title": "SEO title under 70 chars, specific to their niche",
    "intro": "2-sentence hook addressing the target audience's real pain point.",
    "sections": [
      {"heading": "heading", "body": "2-3 sentences with specific details"},
      {"heading": "heading", "body": "2-3 sentences with specific details"},
      {"heading": "heading", "body": "2-3 sentences with specific details"}
    ],
    "cta": "1-2 sentence CTA naming their specific product or service."
  }
}`
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", errText);
      return res.status(500).json({ error: "AI generation failed", detail: errText });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json[\s\S]*?```/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error("JSON parse failed:", clean);
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: err.message || "Something went wrong" });
  }
}
