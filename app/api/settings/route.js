import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const DEFAULT_SETTINGS = {
  weakTopicWeight: 0.35,
  semanticWeight: 0.35,
  difficultyWeight: 0.25,
  diversityWeight: 0.05,
  maxRecommendations: 5,
  maxCandidates: 20,
  useLlmRerank: true,
};

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("lcgenie");

    const settings = await db.collection("settings").findOne({ key: "global" });

    return NextResponse.json({
      ok: true,
      settings: settings?.value || DEFAULT_SETTINGS,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const nextSettings = {
      weakTopicWeight: Number(body.weakTopicWeight ?? 0.35),
      semanticWeight: Number(body.semanticWeight ?? 0.35),
      difficultyWeight: Number(body.difficultyWeight ?? 0.25),
      diversityWeight: Number(body.diversityWeight ?? 0.05),
      maxRecommendations: Number(body.maxRecommendations ?? 5),
      maxCandidates: Number(body.maxCandidates ?? 20),
      useLlmRerank: Boolean(body.useLlmRerank ?? true),
    };

    const client = await clientPromise;
    const db = client.db("lcgenie");

    await db.collection("settings").updateOne(
      { key: "global" },
      {
        $set: {
          key: "global",
          value: nextSettings,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    return NextResponse.json({
      ok: true,
      settings: nextSettings,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
