import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

const API_BASE =
  process.env.LEETCODE_API_BASE ||
  "https://leetcode-graphql-to-rest.onrender.com";

function getSolvedStats(profile) {
  const stats = profile?.matchedUser?.submitStats?.acSubmissionNum || [];

  const getCount = (difficulty) =>
    stats.find((item) => item.difficulty === difficulty)?.count || 0;

  return {
    total: getCount("All"),
    easy: getCount("Easy"),
    medium: getCount("Medium"),
    hard: getCount("Hard"),
  };
}

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { error: "username is required" },
        { status: 400 },
      );
    }

    const [
      profileRes,
      badgesRes,
      acceptedSubmissionsRes,
      calendarRes,
      contestsRes,
      attendedContestsRes,
    ] = await Promise.all([
      fetch(`${API_BASE}/${encodeURIComponent(username)}`),
      fetch(`${API_BASE}/${encodeURIComponent(username)}/getBadges`),
      fetch(`${API_BASE}/${encodeURIComponent(username)}/acUserSubmissions/50`),
      fetch(`${API_BASE}/${encodeURIComponent(username)}/userCalendar`),
      fetch(`${API_BASE}/${encodeURIComponent(username)}/allContests`),
      fetch(`${API_BASE}/${encodeURIComponent(username)}/allAttendedContests`),
    ]);

    const responses = [
      ["profile", profileRes],
      ["badges", badgesRes],
      ["acceptedSubmissions", acceptedSubmissionsRes],
      ["calendar", calendarRes],
      ["contests", contestsRes],
      ["attendedContests", attendedContestsRes],
    ];

    for (const [name, res] of responses) {
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          {
            error: `Failed to fetch ${name}`,
            status: res.status,
            details: text,
          },
          { status: 502 },
        );
      }
    }

    const [
      profile,
      badges,
      acceptedSubmissions,
      calendar,
      contests,
      attendedContests,
    ] = await Promise.all([
      profileRes.json(),
      badgesRes.json(),
      acceptedSubmissionsRes.json(),
      calendarRes.json(),
      contestsRes.json(),
      attendedContestsRes.json(),
    ]);

    const client = await clientPromise;
    const db = client.db("lcgenie");

    // Save raw user snapshot
    await db.collection("users").updateOne(
      { username },
      {
        $set: {
          username,
          profile,
          badges,
          calendar,
          contests,
          attendedContests,
          syncedAt: new Date(),
        },
      },
      { upsert: true },
    );

    // Save cleaned accepted submissions
    const accepted = acceptedSubmissions?.recentAcSubmissionList || [];

    const cleaned = accepted
      .filter((item) => item?.titleSlug)
      .map((item) => ({
        username,
        title: item.title,
        titleSlug: item.titleSlug,
        timestamp: item.timestamp,
        statusDisplay: "Accepted",
        lang: item.lang || null,
        syncedAt: new Date(),
      }));

    // Deduplicate by titleSlug
    const deduped = [
      ...new Map(cleaned.map((item) => [item.titleSlug, item])).values(),
    ];

    // Replace old submissions for this user so sync stays fresh
    await db.collection("submissions").deleteMany({ username });

    if (deduped.length > 0) {
      await db.collection("submissions").insertMany(deduped);
    }

    const solvedStats = getSolvedStats(profile);
    const realName = profile?.matchedUser?.profile?.realName || username;

    const recentSubmissions = deduped.slice(0, 5).map((item) => ({
      title: item.title,
      titleSlug: item.titleSlug,
      timestamp: item.timestamp,
    }));

    return NextResponse.json({
      ok: true,
      summary: {
        username,
        realName,
        solvedStats,
        recentSubmissions,
      },
      savedSubmissions: deduped.length,
    });
  } catch (error) {
    console.error("SYNC ERROR:", error);
    return NextResponse.json(
      { error: "Sync failed", details: String(error) },
      { status: 500 },
    );
  }
}
