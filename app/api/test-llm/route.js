import { NextResponse } from "next/server";
import { generateRecommendationExplanation } from "@/lib/llm";

export async function GET() {
  try {
    const profile = {
      solvedCount: 181,
      averageDifficultyLabel: "Medium",
      weakTopics: ["Graphs", "Dynamic Programming"],
      strongTopics: ["Arrays", "Hash Map"],
      recentTopicTrends: [
        { topic: "Graphs", delta: 2 },
        { topic: "Dynamic Programming", delta: 1 },
      ],
    };

    const recommendations = [
      {
        title: "Number of Islands",
        difficulty: "Medium",
        tags: ["Graphs", "DFS"],
        matchedTopics: ["Graphs"],
        reason: "Matches weak Graphs area",
      },
      {
        title: "House Robber",
        difficulty: "Medium",
        tags: ["Dynamic Programming"],
        matchedTopics: ["Dynamic Programming"],
        reason: "Matches weak DP area",
      },
    ];

    const explanation = await generateRecommendationExplanation(
      profile,
      recommendations,
    );

    return NextResponse.json({
      ok: true,
      explanation,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
