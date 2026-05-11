const floatingSentences = [
  { id: "fresh", text: "Fresh. Pure. Authentic.", paletteIndex: 0, top: "10%", left: "4%", duration: "18s", delay: "-2s" },
  { id: "life", text: "Spice Up Your Life", paletteIndex: 1, top: "17%", left: "70%", duration: "20s", delay: "-7s" },
  { id: "taste", text: "Real Taste, Real Spices", paletteIndex: 2, top: "33%", left: "12%", duration: "17s", delay: "-5s" },
  { id: "farm", text: "Farm to Kitchen", paletteIndex: 3, top: "38%", left: "74%", duration: "19s", delay: "-11s" },
  { id: "premium", text: "Premium Indian Masalas", paletteIndex: 4, top: "56%", left: "6%", duration: "21s", delay: "-8s" },
  { id: "aroma", text: "Aroma That Speaks", paletteIndex: 5, top: "62%", left: "66%", duration: "18s", delay: "-4s" },
  { id: "quality", text: "Quality You Can Trust", paletteIndex: 6, top: "78%", left: "18%", duration: "22s", delay: "-13s" },
  { id: "crafted", text: "Crafted for Taste", paletteIndex: 0, top: "82%", left: "72%", duration: "20s", delay: "-9s" },
];

const palettes = [
  ["#ff8f00", "#e3a008", "#c62828"],
  ["#c62828", "#ff8f00", "#2e7d32"],
  ["#2e7d32", "#ff8f00", "#e3a008"],
  ["#e3a008", "#ffb74d", "#c62828"],
  ["#ff7043", "#ffb300", "#8d6e63"],
  ["#2e7d32", "#66bb6a", "#ff8f00"],
  ["#c62828", "#ef6c00", "#e3a008"],
];

function FloatingSentences() {
  return (
    <div className="rebuild-sentences-layer" aria-hidden="true">
      {floatingSentences.map((sentence) => {
        const [highlightA, highlightB, highlightC] = palettes[sentence.paletteIndex];

        return (
          <div
            key={sentence.id}
            className="rebuild-floating-sentence"
            style={{
              "--sentence-top": sentence.top,
              "--sentence-left": sentence.left,
              "--sentence-duration": sentence.duration,
              "--sentence-delay": sentence.delay,
              "--sentence-highlight-a": highlightA,
              "--sentence-highlight-b": highlightB,
              "--sentence-highlight-c": highlightC,
            }}
          >
            <span className="rebuild-floating-sentence-copy">{sentence.text}</span>
          </div>
        );
      })}
    </div>
  );
}

export default FloatingSentences;
