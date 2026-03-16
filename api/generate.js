export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Step 1: Fetch the actual website content
  let siteContent = "";
  try {
    const siteRes = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MarketerAI/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await siteRes.text();
    // Strip HTML tags and collapse whitespace for a clean text extract
    siteContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000); // Keep first 3000 chars — enough context
  } catch (e) {
    console.warn("Could not fetch site, falling back to URL inference:", e.message);
  }

  const prompt = `You are an expert marketing strategist and copywriter.

A user wants a marketing campaign for this company: ${url}

${siteContent
  ? `Here is the actual text content scraped from their website:\n"""\n${siteContent}\n"""\n\nUse this real content to accurately describe what the company does.`
  : `We could not fetch the website. Infer the company name, industry, and offerings from the URL itself.`
}

Generate a complete marketing content package. Return ONLY valid JSON (no markdown, no explanation) in this exact format:

{
  "companyName": "the company's real name",
  "tagline": "a punchy one-line brand tagline you created",
  "social": {
    "Twitter": "A punchy tweet under 280 chars with 2-3 relevant hashtags. Hook-first, high-energy.",
    "LinkedIn": "A professional LinkedIn post (150-200 words). Lead with an insight or stat, then connect to the company's value, end with a question to drive engagement.",
    "Instagram": "A vivid, visual Instagram caption (100-130 words) with strong emojis and 5 hashtags at the end."
  },
  "email": {
    "subject": "A compelling email subject line (under 60 chars, curiosity-driven)",
    "body": "A full marketing email (200-250 words). Include: a strong opening hook, 2-3 benefit-driven paragraphs, a clear CTA button text in [brackets], and a P.S. line."
  },
  "blog": {
    "title": "An SEO-optimized blog post title (under 70 chars, includes a power word)",
    "intro": "A gripping 2-sentence intro paragraph that hooks the reader and sets up the problem.",
    "sections": [
      {"heading": "Section 1 heading", "body": "2-3 sentence section body"},
      {"heading": "Section 2 heading", "body": "2-3 sentence section body"},
      {"heading": "Section 3 heading", "body": "2-3 sentence section body"}
    ],
    "cta": "A compelling closing call-to-action paragraph (1-2 sentences)"
  }
}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return res.status(500).json({ error: "AI generation failed" });
    }

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
