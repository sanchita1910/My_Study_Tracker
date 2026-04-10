const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:latest";

export async function generateRecommendationExplanation(
  profile,
  recommendations,
) {
  const topRecommendations = (recommendations || [])
    .slice(0, 5)
    .map((item) => ({
      title: item.title,
      difficulty: item.difficulty,
      tags: item.tags,
      matchedTopics: item.matchedTopics || [],
      reason: item.reason,
    }));

  const prompt = `
You are LCGenie, a LeetCode study coach.

Given the user's profile and top recommended problems, write a short JSON object with:
- summary
- focusAreas
- whyTheseProblems
- nextStep

Keep it concise and clear.

User profile:
${JSON.stringify(
  {
    solvedCount: profile.solvedCount,
    averageDifficultyLabel: profile.averageDifficultyLabel,
    weakTopics: profile.weakTopics,
    strongTopics: profile.strongTopics,
    recentTopicTrends: (profile.recentTopicTrends || []).slice(0, 5),
  },
  null,
  2,
)}

Top recommendations:
${JSON.stringify(topRecommendations, null, 2)}
`;

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: "json",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error: ${res.status} - ${text}`);
  }

  const data = await res.json();

  try {
    return JSON.parse(data.response || "{}");
  } catch {
    return {
      summary: data.response || "",
      focusAreas: [],
      whyTheseProblems: [],
      nextStep: "Practice the recommended problems in order.",
    };
  }
}
