"use client";

import { useState } from "react";
import AdForm, { AdFormData } from "./components/AdForm";
import AdPreview from "./components/AdPreview";

type Screen = "form" | "preview" | "confirmation";

interface GeneratedContent {
  primaryText: string;
  headline: string;
  callToAction: string;
  interests: string[];
  campaignName: string;
  adSetName: string;
  adName: string;
}

interface CampaignResult {
  campaignId: string;
  adsManagerUrl: string;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("form");
  const [formData, setFormData] = useState<AdFormData | null>(null);
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (data: AdFormData) => {
    setFormData(data);
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: data.description,
          location: data.location,
          ageMin: data.ageMin,
          ageMax: data.ageMax,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");

      setGenerated(json);
      setScreen("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!formData || !generated) return;
    setIsCreating(true);
    setError(null);

    try {
      // Convert image to base64 (strip data URL prefix)
      const imageBase64 = formData.imagePreview.replace(
        /^data:image\/\w+;base64,/,
        ""
      );

      const res = await fetch("/api/create-campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          ...generated,
          location: formData.location,
          ageMin: formData.ageMin,
          ageMax: formData.ageMax,
          dailyBudget: formData.dailyBudget,
          publishImmediately: formData.publishImmediately,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Campaign creation failed");

      setResult(json);
      setScreen("confirmation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerate = () => {
    if (formData) handleGenerate(formData);
  };

  const handleReset = () => {
    setScreen("form");
    setFormData(null);
    setGenerated(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-900 py-12 px-4">
      {error && (
        <div className="max-w-xl mx-auto mb-6 bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-400 hover:text-red-300"
          >
            &times;
          </button>
        </div>
      )}

      {screen === "form" && (
        <AdForm onSubmit={handleGenerate} isLoading={isGenerating} />
      )}

      {screen === "preview" && generated && formData && (
        <AdPreview
          generated={generated}
          imagePreview={formData.imagePreview}
          publishImmediately={formData.publishImmediately}
          onConfirm={handleCreate}
          onRegenerate={handleRegenerate}
          onBack={() => setScreen("form")}
          isCreating={isCreating}
        />
      )}

      {screen === "confirmation" && result && (
        <div className="max-w-xl mx-auto text-center space-y-6">
          <div className="text-5xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold text-white">
            Campaign Created!
          </h1>
          <p className="text-zinc-400">
            {generated?.campaignName}
          </p>
          <p className="text-zinc-500 text-sm">
            Status:{" "}
            {formData?.publishImmediately ? (
              <span className="text-red-400">ACTIVE</span>
            ) : (
              <span className="text-green-400">PAUSED (draft)</span>
            )}
          </p>
          <a
            href={result.adsManagerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            View in Ads Manager
          </a>
          <div>
            <button
              onClick={handleReset}
              className="text-zinc-400 hover:text-white text-sm underline"
            >
              Create another ad
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
