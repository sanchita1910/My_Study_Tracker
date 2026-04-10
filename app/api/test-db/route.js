import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("lcgenie");

  const result = await db.collection("test").insertOne({
    message: "MongoDB connected!",
    createdAt: new Date(),
  });

  return Response.json({ success: true, result });
}
