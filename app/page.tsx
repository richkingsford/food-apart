"use client";

import { useMemo, useState } from "react";
import cerealData from "../data/cereals.json";

type Product = (typeof cerealData.products)[number];

const products = cerealData.products as Product[];

const palettes = [
  ["#ff7d68", "#ffd66b"],
  ["#8c72ff", "#c4f16a"],
  ["#2db8a6", "#f7a6d2"],
  ["#f5bd3f", "#ff8e8e"],
];

const goalOptions = [
  { id: "steady", icon: "↗", title: "Steady mornings", description: "more staying power", score: (p: Product) => (p.nutritionPer100g.fiberG ?? 0) * 6 - (p.nutritionPer100g.sugarG ?? 12) * 1.4 + (getSignals(p).whole ? 16 : 0) },
  { id: "sweet", icon: "✦", title: "Less sweet", description: "a gentler sugar story", score: (p: Product) => 100 - (p.nutritionPer100g.sugarG ?? 18) * 4 },
  { id: "fiber", icon: "✺", title: "Fiber fireworks", description: "celebrate the roughage", score: (p: Product) => (p.nutritionPer100g.fiberG ?? 0) * 9 + (getSignals(p).whole ? 12 : 0) },
  { id: "whole", icon: "◒", title: "Whole-grain glow", description: "let the grain shine", score: (p: Product) => (getSignals(p).whole ? 78 : 22) + (p.nutritionPer100g.fiberG ?? 0) * 3 },
  { id: "mellow", icon: "〰", title: "Keep it mellow", description: "a quieter sodium signal", score: (p: Product) => 100 - (p.nutritionPer100g.sodiumMg ?? 500) / 7 },
  { id: "simple", icon: "…", title: "Simple stories", description: "fewer plot twists", score: (p: Product) => 100 - p.ingredients.split(",").length * 3 + (getSignals(p).whole ? 10 : 0) },
  { id: "bright", icon: "☼", title: "Bright all-rounder", description: "a little bit of everything", score: (p: Product) => getSignals(p).score },
] as const;
type GoalId = (typeof goalOptions)[number]["id"];

function getSignals(product: Product) {
  const n = product.nutritionPer100g;
  const ingredients = product.ingredients.toLowerCase();
  const first = product.ingredients.split(",")[0].trim().toLowerCase();
  const sweet = n.sugarG === null ? "unknown" : n.sugarG > 15 ? "high" : n.sugarG > 8 ? "mid" : "low";
  const fiber = n.fiberG === null ? "unknown" : n.fiberG >= 8 ? "high" : n.fiberG >= 4 ? "mid" : "low";
  const whole = /whole grain|whole wheat|whole oat|rolled oats|sprouted/.test(ingredients);
  const flags = [
    sweet === "high" ? "sweet" : null,
    n.sodiumMg !== null && n.sodiumMg > 500 ? "salty" : null,
    fiber === "high" ? "fiber-rich" : null,
    whole ? "whole grain" : null,
  ].filter(Boolean) as string[];
  const score = Math.max(48, Math.min(94, 72 + (whole ? 10 : 0) + (fiber === "high" ? 9 : fiber === "mid" ? 4 : 0) - (sweet === "high" ? 13 : sweet === "mid" ? 5 : 0) - (n.sodiumMg !== null && n.sodiumMg > 500 ? 5 : 0)));
  return { first, sweet, fiber, whole, flags, score };
}

function formatNumber(value: number | null, suffix = "") {
  return value === null ? "—" : `${Math.round(value * 10) / 10}${suffix}`;
}

export default function Home() {
  const [selectedId, setSelectedId] = useState(products[0].id);
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeGoal, setActiveGoal] = useState<GoalId | null>(null);
  const selected = products.find((product) => product.id === selectedId) ?? products[0];
  const signals = getSignals(selected);
  const palette = palettes[products.findIndex((product) => product.id === selected.id) % palettes.length];

  const filtered = useMemo(
    () => products.filter((product) => `${product.name} ${product.brand}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
    [query],
  );

  const swap = products
    .filter((product) => product.id !== selected.id)
    .map((product) => ({ product, signals: getSignals(product) }))
    .sort((a, b) => Math.abs(a.signals.score - signals.score) - Math.abs(b.signals.score - signals.score))[0]?.product;

  const activeGoalData = goalOptions.find((goal) => goal.id === activeGoal);
  const rankedProducts = useMemo(() => activeGoalData ? [...products].sort((a, b) => activeGoalData.score(b) - activeGoalData.score(a)) : products, [activeGoalData]);

  return (
    <main className="site-shell">
      <nav className="topbar">
        <div className="wordmark"><span className="wordmark-dot" />food apart</div>
        <div className="nav-note"><span className="spark">✦</span> tiny truths for the grocery aisle</div>
        <button className="about-button">How it works <span>↗</span></button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">THE CEREAL AISLE, DECODED</p>
          <h1>Meet your breakfast,<br /><em>box by box.</em></h1>
          <p className="hero-lede">A curious little peek inside the foods you already buy—what&apos;s in them, what it means, and what might make a lovely next move.</p>
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a cereal or brand..." aria-label="Search cereals" />
            <span className="search-shortcut">⌘ K</span>
            {query && filtered.length > 0 && (
              <div className="search-results">
                {filtered.map((product) => <button key={product.id} onClick={() => { setSelectedId(product.id); setQuery(""); }}>{product.name}<small>{product.brand}</small></button>)}
              </div>
            )}
          </div>
          <div className="browse-row"><span>Try exploring:</span><button onClick={() => setQuery("Cheerios")}>Cheerios</button><button onClick={() => setQuery("Granola")}>Granola</button><button onClick={() => setQuery("Bran")}>Bran</button></div>
        </div>
        <div className="hero-doodle" aria-hidden="true">
          <div className="sun-burst" />
          <div className="floating-note note-one">ingredient<br /><b>detective</b></div>
          <div className="floating-note note-two">made for<br /><b>real life</b></div>
          <div className="cereal-bowl"><div className="bowl-grain grain-one" /><div className="bowl-grain grain-two" /><div className="bowl-grain grain-three" /><div className="milk" /></div>
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
        </div>
      </section>

      <section className="insight-grid">
        <div className="product-card" style={{ background: `linear-gradient(135deg, ${palette[0]}, ${palette[1]})` }}>
          <div className="card-topline"><span className="pill">{signals.score >= 80 ? "looking bright" : "worth a closer look"}</span><span className="confidence">{selected.confidence === "high" ? "label-backed" : "needs a peek"} ↗</span></div>
          <div className="box-illustration"><div className="box-shadow" /><div className="cereal-box"><div className="box-sun">✦</div><small>{selected.brand}</small><strong>{selected.name.replace(" Cereal", "")}</strong><div className="box-waves">◒ ◓ ◒</div></div></div>
          <div className="product-footer"><div><p className="eyebrow dark-eyebrow">CURRENTLY CURIOUS ABOUT</p><h2>{selected.name.replace(" Cereal", "")}</h2><p>{selected.brand} · {selected.serving.text ?? `${selected.serving.amount} ${selected.serving.unit}`}</p></div><button className="next-button" onClick={() => setSelectedId(products[(products.findIndex((product) => product.id === selected.id) + 1) % products.length].id)} aria-label="Next cereal">→</button></div>
        </div>

        <div className="facts-card">
          <div className="section-heading"><div><p className="eyebrow">WHAT&apos;S IN THE BOWL</p><h2>The first few clues</h2></div><span className="clue-mark">?</span></div>
          <p className="intro">Ingredients are listed from most to least by weight. So the opening words are a tiny plot twist.</p>
          <div className="ingredient-stack">
            {[...selected.ingredients.split(",").slice(0, 4), "...and the supporting cast"].map((ingredient, index) => <div className={`ingredient-row ingredient-${index + 1}`} key={`${ingredient}-${index}`}><span className="ingredient-index">0{index + 1}</span><span>{ingredient.replace(/[.]/g, "").trim()}</span><i style={{ width: `${Math.max(26, 92 - index * 17)}%` }} /></div>)}
          </div>
          <div className="mini-note"><span>✳</span><p><b>Small thing worth knowing:</b> “whole grain” showing up early is generally a good sign—it means the grain kept more of its original parts.</p></div>
        </div>

        <div className="score-card">
          <div className="score-top"><p className="eyebrow">THE GENTLE READ</p><span className="score-badge">{signals.score}<small>/100</small></span></div>
          <h2>A decent start,<br /><em>with a sweet side.</em></h2>
          <p className="score-copy">A quick read of fiber, sweetness, sodium, and what arrives first on the ingredient list.</p>
          <div className="meter-list">
            <div><span>Fiber</span><b className={`tone-${signals.fiber}`}>{signals.fiber === "high" ? "friend" : signals.fiber === "mid" ? "okay" : signals.fiber}</b><i><u style={{ width: signals.fiber === "high" ? "85%" : signals.fiber === "mid" ? "55%" : "28%" }} /></i></div>
            <div><span>Sweetness</span><b className={`tone-${signals.sweet}`}>{signals.sweet === "high" ? "noticeable" : signals.sweet}</b><i><u style={{ width: signals.sweet === "high" ? "82%" : signals.sweet === "mid" ? "55%" : "25%" }} /></i></div>
            <div><span>First clue</span><b>{signals.whole ? "whole grain" : signals.first.slice(0, 18)}</b><i><u style={{ width: signals.whole ? "74%" : "42%" }} /></i></div>
          </div>
          <div className="score-foot"><span>Not a verdict. A nudge.</span><span>↗</span></div>
        </div>

        <div className="swap-card"><div><p className="eyebrow">A LOVELY NEXT MOVE</p><h2>Try a little<br /><em>side quest.</em></h2><p>Not a swap-out. Just another door to open.</p></div><div className="swap-arrow">↘</div><button onClick={() => swap && setSelectedId(swap.id)}><span>{swap?.name.replace(" Cereal", "") ?? "Browse more"}</span><small>{swap?.brand ?? ""}</small><b>see why →</b></button></div>
      </section>

      <section className="cereal-gallery" aria-labelledby="cereal-gallery-title">
        <div className="gallery-heading"><div><p className="eyebrow">THE WHOLE AISLE, IN LITTLE WINDOWS</p><h2 id="cereal-gallery-title">Every box has a story.</h2></div><p>{activeGoalData ? `${activeGoalData.title}: ${activeGoalData.description}. Your best fits float to the front.` : "Twenty cereals, a few useful clues, and plenty to be curious about."}</p></div>
        <div className="goal-picker" aria-label="Choose a health goal"><div className="goal-picker-intro"><span className="eyebrow">CHOOSE YOUR MISSION</span><strong>What would make breakfast feel like a win?</strong></div><button className={!activeGoal ? "goal-button active" : "goal-button"} onClick={() => setActiveGoal(null)}>All the curious</button>{goalOptions.map((goal) => <button key={goal.id} className={activeGoal === goal.id ? "goal-button active" : "goal-button"} onClick={() => setActiveGoal(goal.id)}><span>{goal.icon}</span><b>{goal.title}</b><small>{goal.description}</small></button>)}</div>
        {activeGoalData && <div className="goal-result-note"><span>✦</span><b>Best fits for {activeGoalData.title.toLowerCase()}</b><span>sorted by the clues in the label · click any box to explore</span></div>}
        <div className="cereal-card-grid">
          {rankedProducts.map((product, index) => {
            const cardSignals = getSignals(product);
            const nutrition = product.nutritionPer100g;
            const originalIndex = products.findIndex((item) => item.id === product.id);
            const cardPalette = palettes[originalIndex % palettes.length];
            return <article className="cereal-card" key={product.id} style={{ "--card-accent": cardPalette[0], "--card-soft": cardPalette[1] } as React.CSSProperties}>
              <button className="cereal-card-main" onClick={() => { setSelectedId(product.id); setExpandedId(product.id); }} aria-label={`Explore ${product.name}`}>
                <div className="cereal-card-top"><span className="card-number">{String(originalIndex + 1).padStart(2, "0")}</span><span className="card-confidence">{activeGoal && index < 5 ? "best fit · " + (index + 1) : product.confidence === "high" ? "label-backed" : "needs a peek"}</span></div>
                <div className="mini-box" aria-hidden="true"><span>✦</span><b>{product.name.replace(" Cereal", "")}</b></div>
                <p className="card-brand">{product.brand}</p>
                <h3>{product.name.replace(" Cereal", "")}</h3>
                <p className="card-reading">{cardSignals.whole ? "Whole grain leads the way." : `${cardSignals.first.slice(0, 28)} leads the list.`}</p>
                <div className="card-metrics"><span><b>{nutrition.sugarG === null ? "—" : `${nutrition.sugarG}g`}</b><small>sugar</small></span><span><b>{nutrition.fiberG === null ? "—" : `${nutrition.fiberG}g`}</b><small>fiber</small></span><span><b>{nutrition.sodiumMg === null ? "—" : `${nutrition.sodiumMg}mg`}</b><small>sodium</small></span></div>
                <div className="card-spark" aria-label="Quick nutrition read">
                  <div className="card-spark-row"><span>sweet</span><i><u style={{ width: `${nutrition.sugarG === null ? 22 : Math.min(100, nutrition.sugarG / 25 * 100)}%` }} /></i><b>{nutrition.sugarG === null ? "unknown" : nutrition.sugarG > 15 ? "a lot" : nutrition.sugarG > 8 ? "some" : "a little"}</b></div>
                  <div className="card-spark-row"><span>fiber</span><i><u style={{ width: `${nutrition.fiberG === null ? 22 : Math.min(100, nutrition.fiberG / 12 * 100)}%` }} /></i><b>{nutrition.fiberG === null ? "unknown" : nutrition.fiberG >= 8 ? "plenty" : nutrition.fiberG >= 4 ? "some" : "a little"}</b></div>
                  <div className="card-spark-row"><span>sodium</span><i><u style={{ width: `${nutrition.sodiumMg === null ? 22 : Math.min(100, nutrition.sodiumMg / 800 * 100)}%` }} /></i><b>{nutrition.sodiumMg === null ? "unknown" : nutrition.sodiumMg > 500 ? "a lot" : nutrition.sodiumMg > 200 ? "some" : "a little"}</b></div>
                </div>
                <div className="card-bottom"><span className="tiny-score">{cardSignals.score}<small>/100</small></span><span className="card-arrow">↗</span></div>
              </button>
            </article>;
          })}
        </div>
      </section>

      {expandedId && (() => {
        const detail = products.find((product) => product.id === expandedId);
        if (!detail) return null;
        const detailSignals = getSignals(detail);
        const n = detail.nutritionPer100g;
        const level = (value: number | null, high: number, mid: number, positive = false) => value === null ? "unknown" : positive ? value >= high ? "plenty" : value >= mid ? "some" : "a little" : value > high ? "a lot" : value > mid ? "some" : "a little";
        const width = (value: number | null, max: number) => `${value === null ? 22 : Math.min(100, value / max * 100)}%`;
        const chart = (label: string, value: number | null, unit: string, max: number, read: string, note: string) => <div className="detail-chart"><div className="detail-chart-head"><span>{label}</span><b>{value === null ? "—" : `${value}${unit}`}</b></div><div className="detail-chart-bar"><u style={{ width: width(value, max) }} /></div><strong>{read}</strong><small>{note}</small></div>;
        return <div className="detail-overlay" role="dialog" aria-modal="true" aria-label={`${detail.name} details`} onClick={() => setExpandedId(null)}><div className="detail-panel" onClick={(event) => event.stopPropagation()}><button className="detail-close" onClick={() => setExpandedId(null)} aria-label="Close details">×</button><p className="detail-kicker">FULL CARD · {detail.confidence === "high" ? "LABEL-BACKED" : "NEEDS A PEEK"}</p><div className="detail-title-row"><div><h2>{detail.name.replace(" Cereal", "")}</h2><p>{detail.brand} · {detail.serving.text ?? `${detail.serving.amount} ${detail.serving.unit}`}</p></div><div className="detail-score"><b>{detailSignals.score}<small>/100</small></b><span>{detailSignals.score >= 80 ? "looking bright" : "worth a closer look"}</span></div></div><p className="detail-summary">{detailSignals.whole ? "A whole-grain start gives this bowl a little more staying power." : "A curious label with a few clues worth noticing before the first spoonful."} This is a friendly read, not a verdict.</p><div className="detail-chart-grid">{chart("Sweetness", n.sugarG, "g", 25, level(n.sugarG, 15, 8), "lower is gentler")}{chart("Fiber", n.fiberG, "g", 12, level(n.fiberG, 8, 4, true), "more is a helpful clue")}{chart("Sodium", n.sodiumMg, "mg", 800, level(n.sodiumMg, 500, 200), "lower is gentler")}</div><div className="detail-lower"><div className="detail-ingredients"><p className="detail-kicker">INGREDIENT TRAIL</p><ol>{detail.ingredients.split(",").slice(0, 8).map((ingredient, index) => <li key={`${ingredient}-${index}`}>{ingredient.replace(/[.]/g, "").trim()}</li>)}</ol></div><div className="detail-read"><p className="detail-kicker">QUICK READ</p><p><b>First up:</b> {detailSignals.whole ? "whole grain shows up early" : detailSignals.first}</p><p><b>Little flags:</b> {detailSignals.flags.length ? detailSignals.flags.join(" · ") : "nothing shouting from the label"}</p><p className="detail-note">Numbers are shown per 100g so boxes can be compared on the same little ruler.</p></div></div></div></div>;
      })()}

      <footer><span>food apart <i>•</i> made for better questions</span><span>Data is educational, not medical advice.</span></footer>
    </main>
  );
}
