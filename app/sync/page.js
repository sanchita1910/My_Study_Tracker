"use client";

import { useState } from "react";

export default function SyncPage() {
  const [username, setUsername] = useState("sanchita19Codes");
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSync(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const res = await fetch("/api/sync-leetcode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setSummary(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Sync LeetCode</h1>

      <form onSubmit={handleSync} className="flex gap-3 mb-6">
        <input
          className="border px-4 py-3 rounded w-full"
          placeholder="Enter LeetCode username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          className="px-5 py-3 rounded bg-black text-white"
          type="submit"
          disabled={loading}
        >
          {loading ? "Syncing..." : "Sync"}
        </button>
      </form>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {summary && (
        <div className="space-y-4">
          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Profile</h2>
            <p>
              <span className="font-medium">Username:</span> {summary.username}
            </p>
            <p>
              <span className="font-medium">Name:</span>{" "}
              {summary.realName || "N/A"}
            </p>
            <p>
              <span className="font-medium">Total Solved:</span>{" "}
              {summary.solvedStats.total}
            </p>
            <p>
              <span className="font-medium">Easy / Medium / Hard:</span>{" "}
              {summary.solvedStats.easy} / {summary.solvedStats.medium} /{" "}
              {summary.solvedStats.hard}
            </p>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Recent Accepted Submissions</h2>
            <ul className="list-disc ml-6 space-y-1">
              {summary.recentSubmissions.map((item) => (
                <li key={item.titleSlug}>{item.title}</li>
              ))}
            </ul>
          </div>

          <div className="border rounded p-4">
            <h2 className="font-semibold mb-2">Saved to MongoDB</h2>
            <p>
              Raw user profile saved in <code>users</code>.
            </p>
            <p>
              Accepted submissions saved in <code>submissions</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
