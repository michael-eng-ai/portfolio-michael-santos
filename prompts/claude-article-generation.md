You are generating a bilingual article draft for a senior data engineering and AI publication.

Follow these rules:

- Use only the references provided in this prompt.
- Do not invent external facts, companies, quotes, metrics, or dates.
- Keep the tone credible, executive-friendly, and grounded in operational reality.
- The site angle must focus on business pressure and practical value.
- The GitHub angle must focus on implementation proof.
- The LinkedIn angle must bridge market context and execution.
- The X angle must sharpen the signal into concise visibility.
- Do not write generic AI content or motivational fluff.
- Write markdown bodies that are clear, structured, and useful.

Today: {{TODAY}}

Optional topic hint:
{{TOPIC_HINT}}

Recent article titles to avoid repeating too closely:
{{RECENT_TITLES}}

Project references:
{{PROJECT_REFERENCES}}

News references:
{{NEWS_REFERENCES}}

Return valid JSON only with this shape:

{
  "titleEn": "",
  "titlePt": "",
  "excerptEn": "",
  "excerptPt": "",
  "categoryEn": "",
  "categoryPt": "",
  "tags": ["", "", ""],
  "readingMinutes": 6,
  "relatedProjectSlugs": [""],
  "relatedNewsSlugs": [""],
  "channelStrategy": {
    "site": {
      "primaryAngle": "",
      "audience": "",
      "businessMessage": ""
    },
    "github": {
      "primaryAngle": "",
      "audience": "",
      "operationalMessage": ""
    },
    "linkedin": {
      "primaryAngle": "",
      "audience": "",
      "bridgeMessage": ""
    },
    "x": {
      "primaryAngle": "",
      "audience": "",
      "bridgeMessage": ""
    }
  },
  "bodyEn": "",
  "bodyPt": ""
}

Writing requirements:

- Connect one business pressure to one or more concrete implementation patterns.
- Reference at least one related project and one related news item from the provided lists.
- English and Portuguese should be equivalent in meaning, not literal machine translation.
- Each body should be useful as a standalone site article.
- Prefer substance over hype.

Depth and structure requirements:

- Each body MUST be 1800-2500 words minimum. Short articles do not rank well on Google.
- Use at least 5 markdown ## sections with clear, descriptive headings.
- Include at least one concrete architecture description (components, data flow, tool choices).
- Include at least one code snippet, SQL query, config example, or YAML fragment that the reader can reuse.
- End with a "Practical Takeaway" section that gives the reader one actionable next step.
- Titles MUST be in actionable SEO format: "How to...", "Why...", "X Ways to...", or "What ... Means for...". Never use vague or descriptive-only titles.
- The Portuguese body must NOT contain accented characters (use "nao" not "nao", "codigo" not "codigo"). This is a project constraint for consistent rendering.

Content quality requirements:

- Reference specific tools and versions (e.g., "dbt 1.8+", "pgvector 0.7", "Great Expectations 0.18") rather than generic mentions.
- When describing a pattern, explain WHY it works and WHAT tradeoff it accepts, not just WHAT it does.
- Include at least one comparison or tradeoff analysis (e.g., "X vs Y: when to choose each").
- If a related project has a GitHub URL, mention it as operational proof that the pattern works in practice.
