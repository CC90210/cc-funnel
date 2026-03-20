"use client";

import { useState } from "react";

type Interest = "ai" | "music" | "brand";

interface FormData {
  interests: Interest[];
  name: string;
  email: string;
  instagram: string;
  // AI fields
  businessName: string;
  businessType: string;
  biggestPain: string;
  // Music fields
  eventType: string;
  eventDate: string;
  musicVibe: string;
  // Brand fields
  brandGoal: string;
  audience: string;
  currentFollowing: string;
}

const INITIAL: FormData = {
  interests: [],
  name: "",
  email: "",
  instagram: "",
  businessName: "",
  businessType: "",
  biggestPain: "",
  eventType: "",
  eventDate: "",
  musicVibe: "",
  brandGoal: "",
  audience: "",
  currentFollowing: "",
};

const INTERESTS: { id: Interest; label: string; emoji: string; hook: string }[] = [
  {
    id: "ai",
    label: "AI & Automation",
    emoji: "⚡",
    hook: "Get a free AI audit for your business",
  },
  {
    id: "music",
    label: "DJing & Music",
    emoji: "🎧",
    hook: "Book CC for your next event",
  },
  {
    id: "brand",
    label: "Personal Brand",
    emoji: "🔥",
    hook: "Free 15-min brand strategy session",
  },
];

export default function FunnelPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const totalSteps = 3;
  const progress = done ? 100 : ((step + 1) / (totalSteps + 1)) * 100;

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleInterest(id: Interest) {
    setForm((prev) => {
      const has = prev.interests.includes(id);
      return {
        ...prev,
        interests: has
          ? prev.interests.filter((i) => i !== id)
          : [...prev.interests, id],
      };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDone(true);
      }
    } catch {
      // Silently handle — the thank-you still shows
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center step-enter">
          <div className="text-5xl mb-6">
            {form.interests.includes("ai") && "⚡"}
            {form.interests.includes("music") && "🎧"}
            {form.interests.includes("brand") && "🔥"}
          </div>
          <h1 className="text-2xl font-bold mb-3">You&apos;re in, {form.name.split(" ")[0]}.</h1>
          <p className="text-brand-muted mb-6">
            {form.interests.includes("ai") &&
              "Your free AI audit is on its way. I'll personally review your business and send you a breakdown within 48 hours. "}
            {form.interests.includes("music") &&
              "I'll reach out about your event details shortly. "}
            {form.interests.includes("brand") &&
              "I'll DM you on Instagram to book your free strategy session. "}
          </p>
          <p className="text-sm text-brand-muted">
            — CC
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Progress */}
      <div className="w-full max-w-md mb-8">
        <div className="h-1 bg-brand-card rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-accent progress-bar rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-brand-muted mt-2 text-right">
          Step {step + 1} of {totalSteps}
        </p>
      </div>

      <div className="max-w-md w-full">
        {/* Step 0: Choose interests */}
        {step === 0 && (
          <div className="step-enter">
            <h1 className="text-3xl font-bold mb-2">Hey, I&apos;m CC.</h1>
            <p className="text-brand-muted mb-8">
              Pick what you&apos;re interested in and I&apos;ll hook you up with something free.
            </p>

            <div className="space-y-3 mb-8">
              {INTERESTS.map((item) => {
                const selected = form.interests.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleInterest(item.id)}
                    className={`interest-card w-full text-left p-4 rounded-xl border ${
                      selected
                        ? "selected border-brand-accent"
                        : "border-brand-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.emoji}</span>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-sm text-brand-muted">{item.hook}</p>
                      </div>
                      {selected && (
                        <span className="ml-auto text-brand-accent text-lg">
                          ✓
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={form.interests.length === 0}
              className="btn-primary w-full py-3 rounded-xl text-center"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 1: Interest-specific questions */}
        {step === 1 && (
          <div className="step-enter">
            <h2 className="text-2xl font-bold mb-2">Tell me more.</h2>
            <p className="text-brand-muted mb-6">
              So I can give you something actually useful — not generic fluff.
            </p>

            <div className="space-y-5">
              {form.interests.includes("ai") && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold text-brand-accent mb-2">
                    ⚡ AI & Automation
                  </legend>
                  <input
                    type="text"
                    placeholder="Your business name"
                    value={form.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  />
                  <select
                    value={form.businessType}
                    onChange={(e) => update("businessType", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  >
                    <option value="">What kind of business?</option>
                    <option value="service">Service business (HVAC, plumbing, etc.)</option>
                    <option value="wellness">Wellness / Health / Fitness</option>
                    <option value="realestate">Real estate</option>
                    <option value="restaurant">Restaurant / Hospitality</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="agency">Agency / Consulting</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    placeholder="What's your biggest time-waster right now? (the thing you wish you could automate)"
                    value={form.biggestPain}
                    onChange={(e) => update("biggestPain", e.target.value)}
                    rows={3}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent resize-none"
                  />
                </fieldset>
              )}

              {form.interests.includes("music") && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold text-brand-accent mb-2">
                    🎧 DJing & Music
                  </legend>
                  <select
                    value={form.eventType}
                    onChange={(e) => update("eventType", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  >
                    <option value="">What kind of event?</option>
                    <option value="wedding">Wedding</option>
                    <option value="corporate">Corporate event</option>
                    <option value="party">Private party</option>
                    <option value="bar">Bar / Club night</option>
                    <option value="festival">Festival / Outdoor</option>
                    <option value="other">Other / Just a fan</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Rough date? (or 'just browsing')"
                    value={form.eventDate}
                    onChange={(e) => update("eventDate", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  />
                  <input
                    type="text"
                    placeholder="What vibe are you going for? (e.g. house, hip-hop, open format)"
                    value={form.musicVibe}
                    onChange={(e) => update("musicVibe", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  />
                </fieldset>
              )}

              {form.interests.includes("brand") && (
                <fieldset className="space-y-3">
                  <legend className="text-sm font-semibold text-brand-accent mb-2">
                    🔥 Personal Brand
                  </legend>
                  <select
                    value={form.brandGoal}
                    onChange={(e) => update("brandGoal", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  >
                    <option value="">What's your main goal?</option>
                    <option value="grow">Grow my audience</option>
                    <option value="monetize">Monetize my brand</option>
                    <option value="launch">Launch a product / service</option>
                    <option value="pivot">Pivot / rebrand</option>
                    <option value="learn">Learn from someone doing it</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Who's your audience? (e.g. entrepreneurs, fitness people)"
                    value={form.audience}
                    onChange={(e) => update("audience", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  />
                  <select
                    value={form.currentFollowing}
                    onChange={(e) => update("currentFollowing", e.target.value)}
                    className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                  >
                    <option value="">Current following size?</option>
                    <option value="0-500">0 - 500</option>
                    <option value="500-2k">500 - 2K</option>
                    <option value="2k-10k">2K - 10K</option>
                    <option value="10k+">10K+</option>
                  </select>
                </fieldset>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-3 rounded-xl border border-brand-border text-sm hover:border-brand-muted transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(2)}
                className="btn-primary flex-1 py-3 rounded-xl text-center"
              >
                Almost done
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Contact info */}
        {step === 2 && (
          <div className="step-enter">
            <h2 className="text-2xl font-bold mb-2">Last step — where do I reach you?</h2>
            <p className="text-brand-muted mb-6">
              I&apos;ll personally follow up. No spam, no newsletter — just the free thing you asked for.
            </p>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
              />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="w-full bg-brand-card border border-brand-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted text-sm">
                  @
                </span>
                <input
                  type="text"
                  placeholder="instagram handle"
                  value={form.instagram}
                  onChange={(e) =>
                    update("instagram", e.target.value.replace("@", ""))
                  }
                  className="w-full bg-brand-card border border-brand-border rounded-lg pl-8 pr-4 py-3 text-sm focus:outline-none focus:border-brand-accent"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-brand-border text-sm hover:border-brand-muted transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.email || submitting}
                className="btn-primary flex-1 py-3 rounded-xl text-center"
              >
                {submitting ? "Sending..." : "Get my free stuff"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-brand-muted mt-12">
        Built by CC McKenna
      </p>
    </main>
  );
}
