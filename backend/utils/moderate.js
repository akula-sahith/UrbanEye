// utils/moderate.js
const { GoogleGenAI } = require("@google/genai");

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// safe JSON parser
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
}

async function moderateEvent({ name, description, category }) {
  try {
    const res = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
You are a strict event moderation AI.

Check the following event:

Name: ${name}
Description: ${description || ""}
Category: ${category || ""}

Return ONLY JSON:
{
  "status": "approved" | "rejected" | "pending",
  "reason": "short reason",
  "confidence": 0-1
}
`
    });

    const text = res.text(); // ✅ correct usage
    const parsed = safeParse(text);

    if (!parsed) {
      return {
        status: "pending",
        reason: "AI parse failed",
        confidence: 0.3
      };
    }

    return parsed;

  } catch (err) {
    console.error("Gemini error:", err);

    return {
      status: "pending",
      reason: "AI error fallback",
      confidence: 0.2
    };
  }
}

module.exports = { moderateEvent };