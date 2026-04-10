import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const GRAPHQL_URL = "https://leetcode.com/graphql/";

const QUERY = `
  query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(
      categorySlug: $categorySlug
      limit: $limit
      skip: $skip
      filters: $filters
    ) {
      total: totalNum
      questions: data {
        acRate
        difficulty
        frontendQuestionId: questionFrontendId
        paidOnly: isPaidOnly
        status
        title
        titleSlug
        topicTags {
          name
          slug
          id
        }
      }
    }
  }
`;

function normalizeProblem(q) {
  return {
    id: Number(q.frontendQuestionId) || null,
    title: q.title,
    titleSlug: q.titleSlug,
    difficulty: q.difficulty,
    tags: (q.topicTags || []).map((t) => t.name),
    tagSlugs: (q.topicTags || []).map((t) => t.slug),
    acRate: q.acRate ?? null,
    paidOnly: Boolean(q.paidOnly),
    status: q.status ?? null,
    description: "",
  };
}

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db("lcgenie");

    const limit = 100;
    let skip = 0;
    let total = Infinity;
    const allProblems = [];

    while (skip < total) {
      const res = await fetch(GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: QUERY,
          variables: {
            categorySlug: "",
            limit,
            skip,
            filters: {},
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `LeetCode fetch failed at skip=${skip}: ${res.status} ${text}`,
        );
      }

      const json = await res.json();
      const payload = json?.data?.problemsetQuestionList;

      if (!payload) {
        throw new Error(
          `Missing problemsetQuestionList payload at skip=${skip}`,
        );
      }

      total = payload.total || 0;
      const batch = (payload.questions || []).map(normalizeProblem);
      allProblems.push(...batch);

      skip += limit;
    }

    const deduped = [
      ...new Map(allProblems.map((p) => [p.titleSlug, p])).values(),
    ];

    await db.collection("problems").deleteMany({});
    await db.collection("problems").insertMany(deduped);

    return NextResponse.json({
      ok: true,
      inserted: deduped.length,
      totalFromLeetCode: total,
    });
  } catch (error) {
    console.error("SEED ERROR:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 },
    );
  }
}
