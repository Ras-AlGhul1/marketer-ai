export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const headers = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": "web-search-2025-03-05",
  };

  try {
    // ── STEP 1: Use Claude with web_search to deeply research the company ──
    const researchResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `Please research this company thoroughly by searching the web: ${url}

Search for:
1. Their homepage and about page to understand exactly what they do
2. Their specific products or services with real details
3. Their target customers and unique value proposition
4. Any notable features, pricing, or differentiators

After searching, write a detailed company brief (200-300 words) covering:
- Exact company name
- Precisely what they do (be specific, not vague)
- Their specific products/services with names and details
- Target audience
- Key differentiators and value props
- Tone and brand voice from their site

Be very specific. Do NOT be generic. Use the actual content you find.`
        }],
      }),
    });

    if (!researchResponse.ok) {
      const err = await researchResponse.text();
      console.error("Research step failed:", err);
      return res.status(500).json({ error: "AI research failed" });
    }

    const researchData = await researchResponse.json();

    // Extract the text summary Claude wrote after searching
    const companyBrief = researchData.content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n")
      .trim();

    if (!companyBrief) {
      return res.status(500).json({ error: "Could not research company" });
    }

    // ── STEP 2: Generate the full marketing campaign using the research ──
    const campaignResponse = await fetch("https://api.anthropic.com/v1/messages", {
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
          content: `You are an expert marketing strategist and copywriter.

Here is a detailed research brief about the company you are writing for:

"""
${companyBrief}
"""

Using ONLY the specific details above (real product names, real features, real audience), generate a complete marketing content package. Be highly specific — mention actual product/service names, real use cases, and concrete benefits. Avoid all generic marketing fluff.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:

{
  "companyName": "exact company name",
  "tagline": "a punchy one-line tagline specific to what they actually do",
  "social": {
    "Twitter": "A punchy tweet under 280 chars with 2-3 relevant hashtags. Reference their actual product/service specifically.",
    "LinkedIn": "A professional LinkedIn post (150-200 words). Reference specific features or benefits from the research. End with an engaging question.",
    "Instagram": "A vivid Instagram caption (100-130 words) with emojis and 5 relevant hashtags. Be specific to their niche."
  },
  "email": {
    "subject": "A subject line under 60 chars that references what they specifically offer",
    "body": "A full marketing email (200-250 words) mentioning their specific products/services, real benefits, a CTA in [brackets], and a P.S. line."
  },
  "blog": {
    "title": "An SEO blog title under 70 chars specific to their industry and offering",
    "intro": "2-sentence hook that speaks directly to their target audience's real pain point.",
    "sections": [
      {"heading": "Specific section heading", "body": "2-3 sentences with specific details from the research"},
      {"heading": "Specific section heading", "body": "2-3 sentences with specific details from the research"},
      {"heading": "Specific section heading", "body": "2-3 sentences with specific details from the research"}
    ],
    "cta": "1-2 sentence CTA specific to their product/service."
  }
}`
        }],
      }),
    });

    if (!campaignResponse.ok) {
      const err = await campaignResponse.text();
      console.error("Campaign generation failed:", err);
      return res.status(500).json({ error: "Campaign generation failed" });
    }

    const campaignData = await campaignResponse.json();
    const text = campaignData.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json[\s\S]*?```|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
