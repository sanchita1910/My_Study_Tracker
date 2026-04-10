import { pipeline } from "@xenova/transformers";

let extractor = null;
const embeddingCache = new Map();

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractor;
}

export async function getEmbedding(text) {
  const key = text.trim();

  if (embeddingCache.has(key)) {
    return embeddingCache.get(key);
  }

  const embedder = await getExtractor();
  const output = await embedder(key, {
    pooling: "mean",
    normalize: true,
  });

  const vector = Array.from(output.data);
  embeddingCache.set(key, vector);
  return vector;
}

export async function getEmbeddings(texts = []) {
  const vectors = [];
  for (const text of texts) {
    vectors.push(await getEmbedding(text));
  }
  return vectors;
}

export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function buildProblemText(problem) {
  return [
    problem.title,
    problem.difficulty,
    ...(problem.tags || []),
    problem.description || "",
  ]
    .filter(Boolean)
    .join(". ");
}

export function buildUserText(profile) {
  return [
    `Strong topics: ${(profile.strongTopics || []).join(", ")}`,
    `Weak topics: ${(profile.weakTopics || []).join(", ")}`,
    `Recent trends: ${(profile.recentTopicTrends || [])
      .slice(0, 5)
      .map((x) => `${x.topic}(${x.delta})`)
      .join(", ")}`,
    `Solved titles: ${(profile.solvedTitles || []).slice(0, 15).join(", ")}`,
  ]
    .filter(Boolean)
    .join(". ");
}
