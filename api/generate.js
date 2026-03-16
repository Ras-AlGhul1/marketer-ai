export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  const prompt = `You are an expert marketing strategist and copywriter. A user has provided this company URL: "${url}"

Based on the URL (infer the company's name, industry, and likely offerings from the domain), generate a complete marketing content package. Return ONLY valid JSON (no markdown, no explanation) in this exact format:

{
  "companyName": "inferred company name",
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
        "x-api-key": process.env.ANTHROPIC_API_KEY,       // Set this in Vercel dashboard
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
