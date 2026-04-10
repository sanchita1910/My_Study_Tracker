export const runtime = "nodejs";

import clientPromise from "@/lib/mongodb";
import { buildUserProfile } from "@/lib/profile";
import { recommendProblems } from "@/lib/recommender";
import { generateRecommendationExplanation } from "@/lib/llm";

const DEFAULT_SETTINGS = {
  weakTopicWeight: 0.35,
  semanticWeight: 0.35,
  difficultyWeight: 0.25,
  diversityWeight: 0.05,
  maxRecommendations: 5,
  maxCandidates: 20,
  useLlmRerank: true,
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return Response.json({ error: "username is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("lcgenie");

    const user = await db.collection("users").findOne({ username });

    if (!user) {
      return Response.json(
        { error: "User not found. Sync LeetCode first." },
        { status: 404 },
      );
    }

    const submissions = await db
      .collection("submissions")
      .find({ username, statusDisplay: "Accepted" })
      .sort({ timestamp: -1 })
      .toArray();

    const feedback = await db
      .collection("feedback")
      .find({ username })
      .sort({ timestamp: -1 })
      .toArray();

    const problems = await db.collection("problems").find({}).toArray();

    if (!problems.length) {
      return Response.json(
        { error: "No problems found in MongoDB. Seed problems first." },
        { status: 404 },
      );
    }

    const settingsDoc = await db
      .collection("settings")
      .findOne({ key: "global" });
    const settings = settingsDoc?.value || DEFAULT_SETTINGS;

    const profile = buildUserProfile(submissions, problems);

    const result = await recommendProblems(
      profile,
      problems,
      settings,
      feedback,
    );

    let explanation = null;
    if (settings.useLlmRerank) {
      try {
        explanation = await generateRecommendationExplanation(
          profile,
          result.recommendations || [],
        );
      } catch (llmError) {
        console.error("LLM ERROR:", llmError);
        explanation = null;
      }
    }

    return Response.json({
      username,
      profile,
      settings,
      recommendations: result.recommendations || [],
      candidates: result.candidates || [],
      explanation,
    });
  } catch (error) {
    console.error("API ERROR:", error);
    return Response.json(
      { error: "Failed to load recommendations", details: String(error) },
      { status: 500 },
    );
  }
}
