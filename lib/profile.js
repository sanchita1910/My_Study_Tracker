const DIFFICULTY_SCORE = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
};

function difficultyToScore(difficulty) {
  return DIFFICULTY_SCORE[difficulty] || 1;
}

function scoreToDifficulty(score) {
  if (score < 1.5) return "Easy";
  if (score < 2.5) return "Medium";
  return "Hard";
}

function slugify(text = "") {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  const out = [];

  for (const item of arr) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

export function buildUserProfile(submissions = [], problems = []) {
  const problemBySlug = new Map();
  const allTopics = new Set();

  for (const problem of problems) {
    const slug = problem?.titleSlug || slugify(problem?.title || "");
    if (slug) {
      problemBySlug.set(slug, problem);
    }

    for (const tag of problem?.tags || []) {
      allTopics.add(tag);
    }
  }

  const solved = uniqueBy(
    submissions
      .filter((s) => (s.statusDisplay || "").toLowerCase() === "accepted")
      .map((s) => ({
        ...s,
        titleSlug: s.titleSlug || slugify(s.title || ""),
        timestamp: Number(s.timestamp || 0),
      }))
      .filter((s) => s.titleSlug),
    (s) => s.titleSlug,
  ).sort((a, b) => b.timestamp - a.timestamp);

  const topicCounts = Object.fromEntries([...allTopics].map((tag) => [tag, 0]));
  let totalDifficulty = 0;
  let matchedProblemCount = 0;

  for (const sub of solved) {
    const problem = problemBySlug.get(sub.titleSlug);
    if (!problem) continue;

    matchedProblemCount += 1;
    totalDifficulty += difficultyToScore(problem.difficulty);

    for (const tag of problem.tags || []) {
      topicCounts[tag] = (topicCounts[tag] || 0) + 1;
    }
  }

  const averageDifficultyScore = matchedProblemCount
    ? totalDifficulty / matchedProblemCount
    : 1;

  const topicCoverage = Object.entries(topicCounts)
    .map(([topic, count]) => ({
      topic,
      count,
      coverage: matchedProblemCount ? count / matchedProblemCount : 0,
    }))
    .sort((a, b) => b.count - a.count || b.coverage - a.coverage);

  const strongTopics = topicCoverage.slice(0, 5).map((x) => x.topic);

  const weakTopics = [...topicCoverage]
    .sort((a, b) => a.count - b.count || a.coverage - b.coverage)
    .slice(0, 5)
    .map((x) => x.topic);

  const recentWindow = solved.slice(0, Math.min(5, solved.length));
  const priorWindow = solved.slice(5, Math.min(10, solved.length));

  const recentCounts = {};
  const priorCounts = {};

  for (const sub of recentWindow) {
    const problem = problemBySlug.get(sub.titleSlug);
    if (!problem) continue;

    for (const tag of problem.tags || []) {
      recentCounts[tag] = (recentCounts[tag] || 0) + 1;
    }
  }

  for (const sub of priorWindow) {
    const problem = problemBySlug.get(sub.titleSlug);
    if (!problem) continue;

    for (const tag of problem.tags || []) {
      priorCounts[tag] = (priorCounts[tag] || 0) + 1;
    }
  }

  const recentTopicTrends = [...allTopics]
    .map((topic) => {
      const recentCount = recentCounts[topic] || 0;
      const priorCount = priorCounts[topic] || 0;

      return {
        topic,
        recentCount,
        priorCount,
        delta: recentCount - priorCount,
      };
    })
    .sort((a, b) => b.delta - a.delta);

  return {
    solvedCount: solved.length,
    matchedProblemCount,
    averageDifficulty: averageDifficultyScore,
    averageDifficultyLabel: scoreToDifficulty(averageDifficultyScore),
    strongTopics,
    weakTopics,
    topicCoverage,
    recentTopicTrends,
    solvedTitles: solved.map((s) => s.title),
    solvedSlugs: solved.map((s) => s.titleSlug),
  };
}
