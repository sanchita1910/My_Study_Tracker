"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState(null);
  const username = "sanchita19Codes";

  useEffect(() => {
    fetch(`/api/recommendations?username=${username}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error(err));
  }, []);

  async function sendFeedback(titleSlug, action) {
    await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        titleSlug,
        action,
      }),
    });
  }

  if (!data) return <div className="p-8">Loading LCGenie...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">LCGenie</h1>

      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="font-semibold mb-2">Weak Topics</h2>
        <p>
          {data?.profile?.weakTopics?.length
            ? data.profile.weakTopics.join(", ")
            : "No weak topics found"}
        </p>
      </div>

      {data.explanation && (
        <div className="mb-6 p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Why these recommendations?</h2>
          <p className="mb-2">{data.explanation.summary}</p>
          <p className="text-sm text-gray-600">
            Focus Areas: {data.explanation.focusAreas?.join(", ")}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Next Step:{" "}
            {data.explanation.nextStep?.description ||
              data.explanation.nextStep}
          </p>
        </div>
      )}

      <div className="p-4 border rounded-lg">
        <h2 className="font-semibold mb-4">Recommended Problems</h2>

        <div className="space-y-4">
          {data.recommendations?.map((problem) => (
            <div key={problem.titleSlug} className="p-4 border rounded-md">
              <h3 className="font-semibold text-lg">{problem.title}</h3>
              <p className="text-sm text-gray-500">
                Difficulty: {problem.difficulty}
              </p>
              <p className="text-sm mt-2">{problem.reason}</p>
              <p className="text-sm mt-2">Tags: {problem.tags.join(", ")}</p>

              <div className="flex gap-2 mt-3">
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={() => sendFeedback(problem.titleSlug, "clicked")}
                >
                  Clicked
                </button>
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={() => sendFeedback(problem.titleSlug, "solved")}
                >
                  Solved
                </button>
                <button
                  className="px-3 py-1 rounded border text-sm"
                  onClick={() => sendFeedback(problem.titleSlug, "skipped")}
                >
                  Skipped
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
