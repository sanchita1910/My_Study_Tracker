// import {
//   getEmbedding,
//   cosineSimilarity,
//   buildProblemText,
//   buildUserText,
// } from "./embeddings.js";

// const DIFFICULTY_SCORE = {
//   Easy: 1,
//   Medium: 2,
//   Hard: 3,
// };

// function difficultyToScore(difficulty) {
//   return DIFFICULTY_SCORE[difficulty] || 1;
// }

// function buildReason(problem, weakMatchCount, semanticScore, difficultyScore) {
//   const matched = (problem.tags || []).slice(0, 2).join(", ");

//   return `Matches weak areas (${matched || "general practice"}), semantic similarity ${semanticScore.toFixed(
//     2,
//   )}, difficulty fit ${difficultyScore.toFixed(2)}.`;
// }

// export async function recommendProblems(profile, problems = [], options = {}) {
//   const {
//     weakTopicWeight = 0.35,
//     semanticWeight = 0.35,
//     difficultyWeight = 0.25,
//     diversityWeight = 0.05,
//     maxRecommendations = 5,
//     maxCandidates = 20,
//   } = options;

//   const solvedSet = new Set(profile.solvedSlugs || []);
//   const candidates = problems.filter(
//     (problem) => problem?.titleSlug && !solvedSet.has(problem.titleSlug),
//   );

//   if (candidates.length === 0) {
//     return {
//       candidates: [],
//       recommendations: [],
//       reason: "No unsolved problems available.",
//     };
//   }

//   const userText = buildUserText(profile);
//   const userEmbedding = await getEmbedding(
//     userText || "LeetCode practice profile",
//   );

//   const weakTopics = new Set(profile.weakTopics || []);
//   const strongTopics = new Set(profile.strongTopics || []);
//   const targetDifficulty = profile.averageDifficulty || 1;

//   const scored = [];

//   for (const problem of candidates) {
//     const problemText = buildProblemText(problem);
//     const problemEmbedding = await getEmbedding(problemText);

//     const tags = problem.tags || [];
//     const weakMatchCount = tags.filter((t) => weakTopics.has(t)).length;
//     const strongMatchCount = tags.filter((t) => strongTopics.has(t)).length;

//     const weakTopicScore = Math.min(1, weakMatchCount / 2);
//     const strongPenalty = strongMatchCount > 0 ? 0.1 : 0;

//     const problemDifficulty = difficultyToScore(problem.difficulty);
//     const difficultyScore =
//       1 - Math.min(1, Math.abs(problemDifficulty - targetDifficulty) / 2.5);

//     const semanticScore = cosineSimilarity(userEmbedding, problemEmbedding);

//     const score =
//       weakTopicWeight * weakTopicScore +
//       semanticWeight * semanticScore +
//       difficultyWeight * difficultyScore +
//       diversityWeight * (1 - strongPenalty);

//     scored.push({
//       ...problem,
//       score,
//       reason: buildReason(
//         problem,
//         weakMatchCount,
//         semanticScore,
//         difficultyScore,
//       ),
//       matchedTopics: tags.filter((t) => weakTopics.has(t)),
//     });
//   }

//   scored.sort((a, b) => b.score - a.score);

//   const selected = [];
//   const topicUse = new Map();

//   for (const item of scored) {
//     const primaryTopic = item.tags?.[0] || "General";
//     const count = topicUse.get(primaryTopic) || 0;

//     if (count >= 2) continue;

//     selected.push(item);
//     topicUse.set(primaryTopic, count + 1);

//     if (selected.length >= maxRecommendations) break;
//   }

//   return {
//     candidates: scored.slice(0, maxCandidates),
//     recommendations: selected,
//   };
// }

import {
  getEmbedding,
  cosineSimilarity,
  buildProblemText,
  buildUserText,
} from "./embeddings.js";

const DIFFICULTY_SCORE = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

function difficultyToScore(difficulty) {
  return DIFFICULTY_SCORE[difficulty] || 1;
}

function buildReason(problem, weakMatchCount, semanticScore, difficultyScore) {
  const matched = (problem.tags || []).slice(0, 2).join(", ");

  return `Matches weak areas (${matched || "general practice"}), semantic similarity ${semanticScore.toFixed(
    2,
  )}, difficulty fit ${difficultyScore.toFixed(2)}.`;
}

function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getFeedbackBoost(problem, feedback = []) {
  const related = feedback.filter((f) => f.titleSlug === problem.titleSlug);

  let boost = 0;

  for (const item of related) {
    if (item.action === "clicked") boost += 0.05;
    if (item.action === "solved") boost += 0.15;
    if (item.action === "skipped") boost -= 0.1;
  }

  return Math.max(-0.2, Math.min(0.2, boost));
}

export async function recommendProblems(
  profile,
  problems = [],
  options = {},
  feedback = [],
) {
  const {
    weakTopicWeight = 0.35,
    semanticWeight = 0.35,
    difficultyWeight = 0.25,
    diversityWeight = 0.05,
    maxRecommendations = 5,
    maxCandidates = 20,
  } = options;

  const solvedSet = new Set(profile.solvedSlugs || []);
  const normalizedProblems = problems.map((problem) => ({
    ...problem,
    titleSlug: problem.titleSlug || slugify(problem.title),
  }));

  const candidates = normalizedProblems.filter(
    (problem) => problem.titleSlug && !solvedSet.has(problem.titleSlug),
  );

  if (candidates.length === 0) {
    return {
      candidates: [],
      recommendations: [],
      reason: "No unsolved problems available.",
    };
  }

  const userText = buildUserText(profile);
  const userEmbedding = await getEmbedding(
    userText || "LeetCode practice profile",
  );

  const weakTopics = new Set(profile.weakTopics || []);
  const strongTopics = new Set(profile.strongTopics || []);
  const targetDifficulty = profile.averageDifficulty || 1;

  const scored = [];

  for (const problem of candidates) {
    const problemText = buildProblemText(problem);
    const problemEmbedding = await getEmbedding(problemText);

    const tags = problem.tags || [];
    const weakMatchCount = tags.filter((t) => weakTopics.has(t)).length;
    const strongMatchCount = tags.filter((t) => strongTopics.has(t)).length;

    const weakTopicScore = Math.min(1, weakMatchCount / 2);
    const strongPenalty = strongMatchCount > 0 ? 0.1 : 0;

    const problemDifficulty = difficultyToScore(problem.difficulty);
    const difficultyScore =
      1 - Math.min(1, Math.abs(problemDifficulty - targetDifficulty) / 2.5);

    const semanticScore = cosineSimilarity(userEmbedding, problemEmbedding);
    const feedbackBoost = getFeedbackBoost(problem, feedback);

    const score =
      weakTopicWeight * weakTopicScore +
      semanticWeight * semanticScore +
      difficultyWeight * difficultyScore +
      diversityWeight * (1 - strongPenalty) +
      feedbackBoost;

    scored.push({
      ...problem,
      score,
      reason: buildReason(
        problem,
        weakMatchCount,
        semanticScore,
        difficultyScore,
      ),
      matchedTopics: tags.filter((t) => weakTopics.has(t)),
    });
  }

  scored.sort((a, b) => b.score - a.score);

  const selected = [];
  const topicUse = new Map();

  for (const item of scored) {
    const primaryTopic = item.tags?.[0] || "General";
    const count = topicUse.get(primaryTopic) || 0;

    if (count >= 2) continue;

    selected.push(item);
    topicUse.set(primaryTopic, count + 1);

    if (selected.length >= maxRecommendations) break;
  }

  return {
    candidates: scored.slice(0, maxCandidates),
    recommendations: selected,
  };
}
