"use client";

import { useEffect, useState } from "react";

const defaultSettings = {
  weakTopicWeight: 0.35,
  semanticWeight: 0.35,
  difficultyWeight: 0.25,
  diversityWeight: 0.05,
  maxRecommendations: 5,
  maxCandidates: 20,
  useLlmRerank: true,
};

export default function TunePage() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();

        if (data?.ok && data?.settings) {
          setSettings(data.settings);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  function updateField(key, value) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSettings(data.settings);
      setMessage("Settings saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Tune LCGenie</h1>
      <p className="text-gray-600">
        Adjust how the recommender ranks problems.
      </p>

      <div className="space-y-4 border rounded p-4">
        <SettingSlider
          label="Weak Topic Weight"
          value={settings.weakTopicWeight}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => updateField("weakTopicWeight", v)}
        />
        <SettingSlider
          label="Semantic Weight"
          value={settings.semanticWeight}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => updateField("semanticWeight", v)}
        />
        <SettingSlider
          label="Difficulty Weight"
          value={settings.difficultyWeight}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => updateField("difficultyWeight", v)}
        />
        <SettingSlider
          label="Diversity Weight"
          value={settings.diversityWeight}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => updateField("diversityWeight", v)}
        />

        <NumberField
          label="Max Recommendations"
          value={settings.maxRecommendations}
          onChange={(v) => updateField("maxRecommendations", Number(v))}
        />
        <NumberField
          label="Max Candidates"
          value={settings.maxCandidates}
          onChange={(v) => updateField("maxCandidates", Number(v))}
        />

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.useLlmRerank}
            onChange={(e) => updateField("useLlmRerank", e.target.checked)}
          />
          <span className="font-medium">Use LLM rerank/explanation</span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 rounded bg-black text-white"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}

function SettingSlider({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">{Number(value).toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-medium">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded px-3 py-2 w-32"
      />
    </div>
  );
}
