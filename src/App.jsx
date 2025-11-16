// Author: Code by MrDnobody

import React, { useEffect, useRef, useState } from "react";

// ---------------- CONFIG ----------------
const MAX = {
  assignment: 10,
  mst1: 20,
  mst2: 20,
  surprise: 12,
  quiz: 4,
  attendance: 2,
  endsem_written: 60,
  case_study: 10,
  exp1: 30,
  exp2: 30,
  exp3: 30,
  exp4: 30,
  class_performance: 10,
  course_project: 5,
  industry_assessment: 10,
  endsem_practical_external: 40,
  endsem_practical: 40,
};

const INTERNAL_WEIGHT = {
  theory: { assignment: 10, mst1: 10, mst2: 10, surprise: 4, quiz: 4, attendance: 2 },
  hybrid: {
    assignment: 5, mst1: 5, mst2: 5, surprise: 2, quiz: 2, case_study: 5, attendance: 1,
    exp1: 5, exp2: 5, exp3: 5, exp4: 5, class_performance: 2.5,
    course_project: 2.5, industry_assessment: 5, endsem_practical: 20
  },
  practical: {
    exp1: 10, exp2: 10, exp3: 10, exp4: 10,
    class_performance: 5, course_project: 5, industry_assessment: 10
  }
};

const EXTERNAL_WEIGHT = { theory: 60, hybrid: 25, practical: 40 };

const INPUTS = {
  theory: ["assignment","mst1","mst2","surprise","quiz","attendance"],
  hybrid: [
    "assignment","mst1","mst2","surprise","quiz",
    "case_study","attendance",
    "exp1","exp2","exp3","exp4",
    "class_performance","course_project",
    "industry_assessment","endsem_practical"
  ],
  practical: ["exp1","exp2","exp3","exp4","class_performance","course_project","industry_assessment"]
};

const LABELS = {
  assignment: "Assignment (out of 10)",
  mst1: "MST 1 (out of 20)",
  mst2: "MST 2 (out of 20)",
  surprise: "Surprise Test (out of 12)",
  quiz: "Quiz (out of 4)",
  attendance: "Attendance (out of 2)",
  endsem_written: "End Sem Written (out of 60)",
  case_study: "Case Study (out of 10)",
  exp1: "Experiment 1 (out of 30)",
  exp2: "Experiment 2 (out of 30)",
  exp3: "Experiment 3 (out of 30)",
  exp4: "Experiment 4 (out of 30)",
  class_performance: "Class Performance (out of 10)",
  course_project: "Course Project (out of 5)",
  industry_assessment: "Industry Assessment (out of 10)",
  endsem_practical: "End Sem Practical (out of 40)",
  endsem_practical_external: "End Sem Practical External (out of 40)"
};

// -----------------------------------------------------
const clamp = (v, min = 0, max = Infinity) => {
  const x = Number(v);
  return isNaN(x) ? 0 : Math.max(min, Math.min(max, x));
};

function useAnimatedNumber(value, duration = 700) {
  const [display, setDisplay] = useState(value);
  const r = useRef();

  useEffect(() => {
    const start = performance.now();
    const from = Number(display);
    const to = Number(value);
    cancelAnimationFrame(r.current);

    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      setDisplay(Number((from + (to - from) * eased).toFixed(2)));
      if (t < 1) r.current = requestAnimationFrame(step);
    }

    r.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(r.current);
  }, [value]);

  return display;
}

// -----------------------------------------------------
export default function App() {
  const [mode, setMode] = useState("theory");

  const allKeys = [
    ...new Set([
      ...INPUTS.theory,
      ...INPUTS.hybrid,
      ...INPUTS.practical,
      "endsem_written",
      "endsem_practical_external",
      "endsem_practical"
    ])
  ];

  const empty = Object.fromEntries(allKeys.map(k => [k, ""]));
  const [input, setInput] = useState(empty);
  const [result, setResult] = useState(null);

  // -------- CURSOR REFS ----------
  const cursorRef = useRef(null);
  const trailRef = useRef(null);

  // -------- MOBILE-SAFE CURSOR SYSTEM ----------
  useEffect(() => {
    const isMobile =
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0;

    if (isMobile) {
      if (cursorRef.current) cursorRef.current.style.display = "none";
      if (trailRef.current) trailRef.current.style.display = "none";
      return;
    }

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;

    const cursor = cursorRef.current;
    const trail = trailRef.current;

    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
    };

    const animate = () => {
      tx += (x - tx) * 0.15;
      ty += (y - ty) * 0.15;

      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      trail.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", move);
    animate();

    return () => window.removeEventListener("mousemove", move);
  }, []);

    // ---------------- Compute ----------------
  function compute(){
    let internal = 0;
    const rows = [];

    for(const key of INPUTS[mode]){
      const raw = clamp(input[key],0,MAX[key]);
      const w = INTERNAL_WEIGHT[mode][key] || 0;
      const contrib = (raw / MAX[key]) * w;
      internal += contrib;
      rows.push({ key, label: LABELS[key], raw, max: MAX[key], weight: w, contrib });
    }

    let external = 0;
    if(mode === 'theory' || mode === 'hybrid'){
      external = clamp(input.endsem_written,0,60);
      external = (external / 60) * EXTERNAL_WEIGHT[mode];
    }

    if(mode === 'practical'){
      external = clamp(input.endsem_practical_external,0,40);
      external = (external / 40) * EXTERNAL_WEIGHT.practical;
    }

    setResult({ internal, external, final: internal + external, rows });
  }

  function reset(){ setInput(empty); setResult(null); }

  const internalDisplay = useAnimatedNumber(result ? result.internal : 0);
  const externalDisplay = useAnimatedNumber(result ? result.external : 0);
  const finalDisplay = useAnimatedNumber(result ? result.final : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-black p-6 text-white relative" style={{cursor:"none"}}>

      {/* --------- NEON COMET CURSOR --------- */}
      <div ref={cursorRef} className="comet-cursor"></div>
      <div ref={trailRef} className="comet-trail"></div>

      {/* SNOWFALL */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="snow"></div>
      </div>

      {/* CSS */}
      <style>{`
        /* Hide real cursor on desktop (mobile disabled in useEffect) */
        body, * { cursor: none !important; }

        .comet-cursor {
          position: fixed;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 12px 4px rgba(255,255,255,0.9);
          pointer-events: none;
          z-index: 9999;
          transform: translate3d(-200px,-200px,0);
        }

        .comet-trail {
          position: fixed;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(125,90,255,0.4), transparent 60%);
          filter: blur(14px);
          pointer-events: none;
          z-index: 9998;
          transform: translate3d(-200px,-200px,0);
          mix-blend-mode: screen;
        }

        .snow {
          position: absolute;
          top: -10%;
          left: 0;
          width: 100%;
          height: 120%;
          pointer-events: none;
          background-image:
            radial-gradient(3px 3px at 20px 30px, white 70%, transparent 30%),
            radial-gradient(4px 4px at 100px 80px, white 70%, transparent 30%),
            radial-gradient(2px 2px at 200px 50px, white 70%, transparent 30%),
            radial-gradient(3px 3px at 300px 150px, white 70%, transparent 30%),
            radial-gradient(4px 4px at 400px 200px, white 70%, transparent 30%),
            radial-gradient(3px 3px at 600px 120px, white 70%, transparent 30%),
            radial-gradient(2px 2px at 800px 60px, white 70%, transparent 30%),
            radial-gradient(4px 4px at 1000px 200px, white 70%, transparent 30%);
          background-size: 600px 600px;
          animation: fall 4s linear infinite;
          opacity: 0.8;
        }

        @keyframes fall {
          0%   { transform: translateY(-20%) translateX(0px); }
          50%  { transform: translateY(50%) translateX(-30px); }
          100% { transform: translateY(120%) translateX(30px); }
        }
      `}</style>

      {/* background particle layer */}
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="g1" cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g1)" />
      </svg>

      <div className="max-w-6xl mx-auto backdrop-blur-xl bg-white/5 p-1 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-r from-indigo-900/30 to-violet-900/10 backdrop-blur-md border-b border-white/5">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-emerald-300">
              Internal Marks Calculator
            </h1>
            <div className="text-xs text-white/60 mt-1">
              By <span className="font-semibold text-indigo-200">MrDnobody</span> · Premium
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-white/60 mr-2">Mode</div>
            <div className="flex gap-2">
              {['theory','hybrid','practical'].map(m=> (
                <button key={m} onClick={()=>{ setMode(m); reset(); }}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-all ${mode===m? 'bg-indigo-600 text-white ring-1 ring-indigo-400 scale-105':'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Main grid */}
        <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Input cards */}
          <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {INPUTS[mode].map(k=> (
              <label key={k} className="relative group bg-gradient-to-br from-white/6 to-white/3 rounded-xl p-4 border border-white/6 hover:scale-105 transform transition">
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-500/8 to-cyan-400/8 opacity-0 group-hover:opacity-100 transition blur-xl"></div>
                <div className="relative z-10">
                  <div className="text-sm text-white/80 font-medium">{LABELS[k]}</div>
                  <input type="number" min={0} max={MAX[k]} value={input[k]}
                    onChange={(e)=> setInput({...input,[k]: e.target.value})}
                    className="mt-2 w-full p-3 rounded-lg bg-black/60 border border-white/8 text-white" />
                  <div className="text-xs text-white/40 mt-1">max: {MAX[k]}</div>
                </div>
              </label>
            ))}

            {(mode==='theory' || mode==='hybrid') && (
              <div className="bg-gradient-to-br from-yellow-400/6 to-yellow-400/12 rounded-xl p-4 border border-yellow-200/6">
                <div className="text-sm text-white/80">End Sem Written (External — out of 60)</div>
                <input type="number" min={0} max={60} value={input.endsem_written}
                  onChange={(e)=> setInput({...input,endsem_written: e.target.value})}
                  className="mt-2 w-full p-3 rounded-lg bg-black/60 border border-white/8 text-white" />
              </div>
            )}

            {mode==='practical' && (
              <div className="bg-gradient-to-br from-rose-400/6 to-rose-400/12 rounded-xl p-4 border border-rose-200/6">
                <div className="text-sm text-white/80">End Sem Practical External (out of 40)</div>
                <input type="number" min={0} max={40} value={input.endsem_practical_external}
                  onChange={(e)=> setInput({...input,endsem_practical_external: e.target.value})}
                    className="mt-2 w-full p-3 rounded-lg bg-black/60 border border-white/8 text-white" />
              </div>
            )}
            </section>

          {/* Result / Controls */}
          <aside className="rounded-2xl p-6 bg-gradient-to-br from-white/6 to-white/3 border border-white/6 shadow-lg flex flex-col justify-between">
            <div>
              <div className="text-sm text-white/60">Internal • External • Final</div>
              <div className="mt-4 grid grid-cols-1 gap-3">
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">Internal</div>
                  <div className="text-3xl font-extrabold text-indigo-200">{internalDisplay}</div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">External</div>
                  <div className="text-3xl font-extrabold text-amber-200">{externalDisplay}</div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div>
                    <div className="text-xs text-white/60">Final Score</div>
                    <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-100">
                      {finalDisplay} / 100
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <button 
                      onClick={compute} 
                      className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-400 text-white font-semibold shadow hover:scale-105 transition"
                    >
                      Compute
                    </button>

                    <button 
                      onClick={reset} 
                      className="px-3 py-2 rounded-full bg-white/6 text-white/80 hover:bg-white/10 transition"
                    >
                      Reset
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {result && (
              <div className="mt-6 bg-black/30 p-3 rounded-lg border border-white/6">
                <div className="text-xs text-white/70 mb-2">Breakdown (internal contributions)</div>
                <div className="text-sm text-white/90 max-h-40 overflow-auto">
                  {result.rows.map(r=> (
                    <div key={r.key} className="flex justify-between py-1 border-b border-white/3 last:border-b-0">
                      <div className="text-xs">{r.label}</div>
                      <div className="text-xs font-mono">{r.contrib.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-white/50">
              © {new Date().getFullYear()} Internal Marks Calculator — Code by MrDnobody
            </div>
          </aside>

        </main>

      </div>
    </div>
  );
}

