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

      <footer><span>food apart <i>•</i> made for better questions</span><span>Data is educational, not medical advice.</span></footer>
    </main>
  );
}
