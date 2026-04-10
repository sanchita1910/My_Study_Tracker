// import { NextResponse } from "next/server";
// import clientPromise from "@/lib/mongodb";

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     const { username, titleSlug, action } = body;

//     if (!username || !titleSlug || !action) {
//       return NextResponse.json(
//         { error: "username, titleSlug, and action are required" },
//         { status: 400 },
//       );
//     }

//     const validActions = new Set(["clicked", "solved", "skipped"]);
//     if (!validActions.has(action)) {
//       return NextResponse.json({ error: "Invalid action" }, { status: 400 });
//     }

//     const client = await clientPromise;
//     const db = client.db("lcgenie");

//     await db.collection("feedback").insertOne({
//       username,
//       titleSlug,
//       action,
//       timestamp: new Date(),
//     });

//     return NextResponse.json({ ok: true });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to save feedback", details: String(error) },
//       { status: 500 },
//     );
//   }
// }

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, titleSlug, action } = body;

    if (!username || !titleSlug || !action) {
      return NextResponse.json(
        { error: "username, titleSlug, and action are required" },
        { status: 400 },
      );
    }

    const validActions = new Set(["clicked", "solved", "skipped"]);
    if (!validActions.has(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("lcgenie");

    await db.collection("feedback").insertOne({
      username,
      titleSlug,
      action,
      timestamp: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save feedback", details: String(error) },
      { status: 500 },
    );
  }
}
