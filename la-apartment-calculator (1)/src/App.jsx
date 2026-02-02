import { useState, useMemo, useEffect, useCallback } from "react";

/* ─── GOOGLE FONTS ─── */
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

/* ─── GLOBAL CSS ─── */
const globalCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #f4f1ec; --dark: #1a1a1a; --gold: #c4a882; --gold-light: #f5ede3;
    --green: #4a9a6d; --green-light: #e8f5ee; --coral: #c07060; --coral-light: #f5e8e5;
    --gray: #8a7f72; --border: #e8e3dc; --white: #fff; --warm-white: #fefdfb;
    --blue: #7a9cbd; --blue-light: #eaf2f8;
    --purple: #8a7fd4; --purple-light: #f0eefb;
  }
  input:focus, textarea:focus { outline: none; border-color: var(--gold) !important; box-shadow: 0 0 0 3px rgba(196,168,130,0.15) !important; }
  input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
  .card-body { overflow: hidden; max-height: 0; transition: max-height 0.42s cubic-bezier(0.4,0,0.2,1), opacity 0.28s ease; opacity: 0; }
  .card-body.open { max-height: 1400px; opacity: 1; }
  .apt-card { opacity: 0; transform: translateY(12px); animation: cardIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards; }
  @keyframes cardIn { to { opacity: 1; transform: translateY(0); } }
  .grain { position: fixed; inset: 0; pointer-events: none; z-index: 999; opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); background-size: 200px; }
  .comp-cheapest { background: rgba(74,154,109,0.08) !important; color: var(--green) !important; font-weight: 600 !important; }
  .ripple { position: relative; overflow: hidden; }
  .ripple::after { content:''; position:absolute; border-radius:50%; background:rgba(255,255,255,0.3); width:100%; height:100%; top:0; left:0; transform:scale(0); transition:transform 0.5s, opacity 0.5s; opacity:0; }
  .ripple:active::after { transform:scale(2.5); opacity:1; transition:transform 0s, opacity 0s; }
`;
const styleEl = document.createElement("style");
styleEl.textContent = globalCss;
document.head.appendChild(styleEl);

/* ─── DATA ─── */
const COST_CATEGORIES = [
  { key: "rent",        label: "Rent",               icon: "🏠", color: "#c4a882" },
  { key: "parking",    label: "Parking",            icon: "🅿️", color: "#7a9cbd" },
  { key: "electricity",label: "Electricity",        icon: "⚡", color: "#e8c44a" },
  { key: "gas",        label: "Gas",                icon: "🔥", color: "#e88a4a" },
  { key: "water",      label: "Water",              icon: "💧", color: "#5aaccc" },
  { key: "internet",   label: "Internet",           icon: "📶", color: "#8a7fd4" },
  { key: "trash",      label: "Trash / Waste",      icon: "🗑️", color: "#a09080" },
  { key: "insurance",  label: "Renter's Insurance", icon: "🛡️", color: "#6aaa80" },
  { key: "laundry",    label: "Laundry",            icon: "👕", color: "#cc7aaa" },
  { key: "storage",    label: "Storage Unit",       icon: "📦", color: "#d4a050" },
  { key: "other",      label: "Other",              icon: "✦",  color: "#999" },
];

const MOVEIN_FIELDS = [
  { key: "first",     label: "First Month's Rent", icon: "1️⃣" },
  { key: "last",      label: "Last Month's Rent",  icon: "🔚" },
  { key: "deposit",   label: "Security Deposit",   icon: "🏦" },
  { key: "appfee",    label: "Application Fee",    icon: "📝" },
  { key: "broker",    label: "Broker Fee",         icon: "📋" },
  { key: "moveother", label: "Other Move-In",      icon: "📦" },
];

const emptyApartment = () => ({
  id: Date.now() + Math.random(),
  name: "", neighborhood: "", address: "", unit: "",
  sqft: "", bedrooms: "", dateAvailable: "", notes: "",
  costs: Object.fromEntries(COST_CATEGORIES.map(c => [c.key, ""])),
  movein: Object.fromEntries(MOVEIN_FIELDS.map(f => [f.key, ""])),
});

const STORAGE_KEY = "la-apt-calculator-data";

/* ─── HELPERS ─── */
function formatDate(d) {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[parseInt(m,10)-1]} ${parseInt(day,10)}, ${y}`;
}

/* ─── APP ─── */
export default function App() {
  const [apartments, setApartments] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { const p = JSON.parse(saved); if (p.length > 0) return p; }
    } catch(e) {}
    return [emptyApartment()];
  });

  const [view, setView] = useState("input"); // input | cards | neighborhoods
  const [activeTab, setActiveTab] = useState(apartments[0]?.id ?? null);
  const [showComparison, setShowComparison] = useState(false);
  const [activeSection, setActiveSection] = useState({});

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(apartments)); } catch(e) {}
  }, [apartments]);

  const update = useCallback((id, field, value) => {
    setApartments(prev => prev.map(a => {
      if (a.id !== id) return a;
      if (COST_CATEGORIES.find(c => c.key === field)) return { ...a, costs: { ...a.costs, [field]: value } };
      if (MOVEIN_FIELDS.find(f => f.key === field)) return { ...a, movein: { ...a.movein, [field]: value } };
      return { ...a, [field]: value };
    }));
  }, []);

  const addApartment = () => { const n = emptyApartment(); setApartments(prev => [...prev, n]); setActiveTab(n.id); };
  const removeApartment = (id) => { setApartments(prev => prev.filter(a => a.id !== id)); if (activeTab === id) setActiveTab(null); };
  const clearAll = () => { setApartments([emptyApartment()]); setActiveTab(null); setShowComparison(false); };

  const getTotal = (apt) => COST_CATEGORIES.reduce((s, c) => s + (parseFloat(apt.costs[c.key]) || 0), 0);
  const getMoveInTotal = (apt) => MOVEIN_FIELDS.reduce((s, f) => s + (parseFloat(apt.movein[f.key]) || 0), 0);

  const sorted = useMemo(() => [...apartments].sort((a, b) => getTotal(a) - getTotal(b)), [apartments]);
  const filledApts = apartments.filter(a => getTotal(a) > 0);
  const cheapestId = filledApts.length > 1 ? sorted.find(a => getTotal(a) > 0)?.id : null;
  const expensiveId = filledApts.length > 1 ? [...sorted].reverse().find(a => getTotal(a) > 0)?.id : null;

  const cheapestPerCat = useMemo(() => {
    const map = {};
    COST_CATEGORIES.forEach(cat => {
      const vals = filledApts.map(a => ({ id: a.id, v: parseFloat(a.costs[cat.key]) || 0 })).filter(x => x.v > 0);
      if (vals.length > 1) { vals.sort((a, b) => a.v - b.v); map[cat.key] = vals[0].id; }
    });
    return map;
  }, [apartments]);

  // Neighborhood grouping
  const neighborhoodGroups = useMemo(() => {
    const groups = {};
    filledApts.forEach(apt => {
      const key = (apt.neighborhood || "").trim();
      if (!key) return;
      if (!groups[key]) groups[key] = [];
      groups[key].push(apt);
    });
    // sort each group internally by total cost
    Object.keys(groups).forEach(k => { groups[k].sort((a,b) => getTotal(a) - getTotal(b)); });
    return groups;
  }, [apartments]);

  const neighborhoodNames = Object.keys(neighborhoodGroups).sort();
  const hasMultiNeighborhoods = neighborhoodNames.length >= 2;

  const activeNav = view === "input" && showComparison ? "compare" : view;

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "'DM Sans', sans-serif", color: "var(--dark)" }}>
      <div className="grain" />

      {/* ─── HEADER ─── */}
      <header style={{ position: "relative", overflow: "hidden", padding: "44px 28px 32px", background: "var(--dark)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 75% 40%, rgba(196,168,130,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(74,154,109,0.1) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -50, right: -30, width: 200, height: 200, borderRadius: "50%", border: "1px solid rgba(244,241,236,0.07)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -20, right: 40, width: 120, height: 120, borderRadius: "50%", border: "1px solid rgba(244,241,236,0.05)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -20, width: 160, height: 160, borderRadius: "50%", border: "1px solid rgba(196,168,130,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: 10.5, letterSpacing: 3.5, textTransform: "uppercase", color: "var(--gold)", marginBottom: 10, fontWeight: 500 }}>Los Angeles · Apartment Finder</div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, fontWeight: 400, color: "#f4f1ec", lineHeight: 1.15, letterSpacing: -0.5 }}>
            True Monthly Cost <span style={{ fontStyle: "italic", color: "var(--gold)" }}>Calculator</span>
          </h1>
          <p style={{ fontSize: 13, color: "#b8afa5", marginTop: 12, lineHeight: 1.6, maxWidth: 480 }}>
            Compare the real all-in cost of every apartment — rent, utilities, parking, and everything in between.
          </p>
          {filledApts.length > 0 && (
            <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(244,241,236,0.1)" }}>
              {[
                { label: "Apartments", value: apartments.length },
                { label: "Avg Monthly", value: `$${Math.round(filledApts.reduce((s,a) => s + getTotal(a), 0) / filledApts.length).toLocaleString()}` },
                { label: "Range", value: filledApts.length > 1 ? `$${getTotal(sorted.find(a=>getTotal(a)>0)||sorted[0]).toLocaleString()} – $${getTotal([...sorted].reverse().find(a=>getTotal(a)>0)||sorted[0]).toLocaleString()}` : "—" },
                ...(neighborhoodNames.length > 0 ? [{ label: "Areas", value: neighborhoodNames.length }] : []),
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "#a8a098", fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#f4f1ec", marginTop: 3 }}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ─── NAV ─── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 20px 0" }}>
        <div style={{ display: "flex", gap: 5, background: "#fff", borderRadius: 12, padding: 4, border: "1.5px solid var(--border)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {[
            { key: "input",         label: "✏️  Input",          sub: "Add & edit" },
            { key: "cards",         label: "🗂️  My Apartments", sub: filledApts.length > 0 ? `${filledApts.length} saved` : "Summary view" },
            { key: "neighborhoods", label: "📍 By Area",         sub: hasMultiNeighborhoods ? `${neighborhoodNames.length} areas` : "Need 2+ areas", disabled: !hasMultiNeighborhoods },
            { key: "compare",       label: "📊  Compare",        sub: filledApts.length > 1 ? "Side-by-side" : "Need 2+ apts", disabled: filledApts.length < 2 },
          ].map(tab => {
            const isActive = activeNav === tab.key;
            const isDisabled = !!tab.disabled;
            return (
              <button key={tab.key} onClick={() => {
                if (isDisabled) return;
                if (tab.key === "compare") { setView("input"); setShowComparison(true); }
                else { setView(tab.key); setShowComparison(false); }
              }} style={{
                flex: 1, padding: "9px 4px", border: "none", borderRadius: 9, cursor: isDisabled ? "default" : "pointer",
                background: isActive ? "var(--dark)" : "transparent",
                color: isActive ? "#f4f1ec" : isDisabled ? "#ccc" : "var(--dark)",
                fontFamily: "'DM Sans', sans-serif", fontSize: 11.5, fontWeight: 600,
                transition: "all 0.2s ease", textAlign: "center", lineHeight: 1.3, opacity: isDisabled ? 0.5 : 1
              }}>
                {tab.label}
                <div style={{ fontSize: 8.5, fontWeight: 400, opacity: 0.6, marginTop: 1 }}>{tab.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── BODY ─── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 80px" }}>

        {/* ═══════ CARDS VIEW ═══════ */}
        {view === "cards" && (
          <>
            {filledApts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "72px 24px", background: "#fff", borderRadius: 18, border: "1.5px solid var(--border)" }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>🏠</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--dark)", marginBottom: 5 }}>No apartments yet</div>
                <div style={{ fontSize: 12.5, color: "var(--gray)" }}>Go to <strong>Input</strong> to add your first apartment.</div>
              </div>
            ) : filledApts.map((apt, idx) => {
              const total = getTotal(apt);
              const moveInTotal = getMoveInTotal(apt);
              const isCheapest = apt.id === cheapestId;
              const isMostExpensive = apt.id === expensiveId;
              const monthlyCosts = COST_CATEGORIES.filter(c => parseFloat(apt.costs[c.key]) > 0);
              const moveInItems = MOVEIN_FIELDS.filter(f => parseFloat(apt.movein[f.key]) > 0);

              return (
                <div key={apt.id} className="apt-card" style={{ marginBottom: 16, animationDelay: `${idx * 0.07}s` }}>
                  <div style={{
                    background: "#fff", borderRadius: 18,
                    border: isCheapest ? "1.5px solid var(--green)" : isMostExpensive ? "1.5px solid var(--coral)" : "1.5px solid var(--border)",
                    overflow: "hidden", boxShadow: "0 3px 16px rgba(0,0,0,0.05)"
                  }}>
                    {/* Dark hero */}
                    <div style={{ background: "var(--dark)", padding: "20px 22px 16px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 90% 50%, rgba(196,168,130,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, flexWrap: "wrap" }}>
                              {(isCheapest || isMostExpensive) && (
                                <span style={{
                                  fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700,
                                  background: isCheapest ? "var(--green)" : "var(--coral)", color: "#fff",
                                  padding: "3px 9px", borderRadius: 4
                                }}>{isCheapest ? "✓ Lowest Cost" : "⚠ Highest Cost"}</span>
                              )}
                              {apt.neighborhood && (
                                <span style={{ fontSize: 9, letterSpacing: 0.8, color: "var(--gold)", background: "rgba(196,168,130,0.15)", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>
                                  📍 {apt.neighborhood}
                                </span>
                              )}
                            </div>
                            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 21, color: "#f4f1ec", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {apt.name || `Apartment ${apartments.findIndex(a => a.id === apt.id) + 1}`}
                            </div>
                            <div style={{ fontSize: 11, color: "#b0a89d", marginTop: 5, lineHeight: 1.6 }}>
                              {[
                                apt.address,
                                apt.unit ? `Unit ${apt.unit}` : null,
                                apt.bedrooms && apt.sqft ? `${apt.bedrooms}BR · ${Number(apt.sqft).toLocaleString()} sqft` : null,
                                apt.dateAvailable ? `Available ${formatDate(apt.dateAvailable)}` : null,
                              ].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 27, color: "var(--gold)", lineHeight: 1 }}>${total.toLocaleString()}</div>
                            <div style={{ fontSize: 9, color: "#a8a098", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>/month</div>
                          </div>
                        </div>
                        <div style={{ height: 5, marginTop: 14, background: "rgba(244,241,236,0.15)", borderRadius: 3, overflow: "hidden", display: "flex" }}>
                          {COST_CATEGORIES.map(cat => {
                            const v = parseFloat(apt.costs[cat.key]) || 0;
                            const pct = (v / total) * 100;
                            return pct > 0 ? <div key={cat.key} style={{ width: `${pct}%`, background: cat.color }} /> : null;
                          })}
                        </div>
                      </div>
                    </div>

                    {/* 3-col body */}
                    <div style={{ padding: "20px 22px 22px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr 0.9fr", gap: 20 }}>
                      {/* Monthly */}
                      <div>
                        <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gold)", fontWeight: 600, marginBottom: 11 }}>💰 Monthly</div>
                        {monthlyCosts.map(cat => {
                          const v = parseFloat(apt.costs[cat.key]) || 0;
                          const pct = (v / total) * 100;
                          return (
                            <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                              <span style={{ fontSize: 14, flexShrink: 0, width: 22, textAlign: "center" }}>{cat.icon}</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 6 }}>
                                  <span style={{ fontSize: 11.5, color: "#3a3a3a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat.label}</span>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--dark)", flexShrink: 0 }}>${v.toLocaleString()}</span>
                                </div>
                                <div style={{ height: 3, background: "var(--cream)", borderRadius: 2, marginTop: 4 }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: cat.color, borderRadius: 2 }} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {monthlyCosts.length === 0 && <div style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>No costs entered</div>}
                        {apt.sqft && total > 0 && (
                          <div style={{ marginTop: 12, paddingTop: 9, borderTop: "1px solid var(--border)", fontSize: 10.5, color: "var(--gray)" }}>
                            <span style={{ fontWeight: 600, color: "var(--dark)" }}>${(total / Number(apt.sqft)).toFixed(2)}</span> per sqft/mo
                          </div>
                        )}
                      </div>
                      {/* Move-In */}
                      <div>
                        <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--blue)", fontWeight: 600, marginBottom: 11 }}>📋 Move-In</div>
                        {moveInItems.map(f => {
                          const v = parseFloat(apt.movein[f.key]) || 0;
                          return (
                            <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                              <span style={{ fontSize: 14, flexShrink: 0, width: 22, textAlign: "center" }}>{f.icon}</span>
                              <span style={{ flex: 1, fontSize: 11.5, color: "#3a3a3a", minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.label}</span>
                              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--blue)", flexShrink: 0 }}>${v.toLocaleString()}</span>
                            </div>
                          );
                        })}
                        {moveInItems.length === 0 && <div style={{ fontSize: 11, color: "#bbb", fontStyle: "italic" }}>No move-in fees</div>}
                        {moveInTotal > 0 && (
                          <div style={{ marginTop: 12, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                              <span style={{ fontSize: 10.5, color: "var(--gray)" }}>Total</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--blue)" }}>${moveInTotal.toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: 9.5, color: "var(--gray)", marginTop: 3 }}>
                              {(moveInTotal / total).toFixed(1)}× monthly · breaks even in {(moveInTotal / total).toFixed(1)} mo
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Notes + Edit */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--gray)", fontWeight: 600, marginBottom: 11 }}>📝 Notes</div>
                        <div style={{ flex: 1, fontSize: 11.5, color: "#5a5a5a", lineHeight: 1.6 }}>
                          {apt.notes || <span style={{ color: "#bbb", fontStyle: "italic" }}>No notes</span>}
                        </div>
                        <button onClick={() => { setView("input"); setShowComparison(false); setActiveTab(apt.id); }}
                          style={{
                            marginTop: 14, padding: "7px 13px", border: "1px solid var(--border)", borderRadius: 8,
                            background: "var(--cream)", cursor: "pointer", fontSize: 11.5, color: "var(--gray)",
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: "all 0.15s", alignSelf: "flex-start"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--gray)"; }}
                        >✏️ Edit</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ═══════ NEIGHBORHOODS VIEW ═══════ */}
        {view === "neighborhoods" && (
          <>
            {neighborhoodNames.map((name, nIdx) => {
              const group = neighborhoodGroups[name];
              const groupCheapestId = group.length > 1 ? group[0].id : null;
              const groupExpensiveId = group.length > 1 ? group[group.length - 1].id : null;
              const groupAvg = Math.round(group.reduce((s, a) => s + getTotal(a), 0) / group.length);
              const groupMin = getTotal(group[0]);
              const groupMax = getTotal(group[group.length - 1]);

              // per-category cheapest within THIS group
              const groupCheapPerCat = {};
              COST_CATEGORIES.forEach(cat => {
                const vals = group.map(a => ({ id: a.id, v: parseFloat(a.costs[cat.key]) || 0 })).filter(x => x.v > 0);
                if (vals.length > 1) { vals.sort((a, b) => a.v - b.v); groupCheapPerCat[cat.key] = vals[0].id; }
              });

              return (
                <div key={name} className="apt-card" style={{ marginBottom: 20, animationDelay: `${nIdx * 0.08}s` }}>
                  <div style={{ background: "#fff", borderRadius: 18, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "0 3px 16px rgba(0,0,0,0.05)" }}>
                    {/* Area header */}
                    <div style={{ background: "var(--dark)", padding: "18px 22px 14px", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 80% at 85% 40%, rgba(138,127,212,0.14) 0%, transparent 65%)", pointerEvents: "none" }} />
                      <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "var(--purple)", fontWeight: 600, marginBottom: 4 }}>📍 Neighborhood</div>
                          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "#f4f1ec", lineHeight: 1.2 }}>{name}</div>
                          <div style={{ fontSize: 11, color: "#b0a89d", marginTop: 4 }}>{group.length} apartment{group.length > 1 ? "s" : ""} listed</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: "#a8a098", marginBottom: 2 }}>Avg / mo</div>
                          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "var(--gold)" }}>${groupAvg.toLocaleString()}</div>
                          {group.length > 1 && (
                            <div style={{ fontSize: 9.5, color: "#b0a89d", marginTop: 3 }}>
                              ${groupMin.toLocaleString()} – ${groupMax.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Comparison table for this neighborhood */}
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", background: "#faf8f5" }}>
                            <th style={{ textAlign: "left", padding: "9px 14px", color: "var(--gray)", fontWeight: 600, fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.8, width: "38%" }}>Category</th>
                            {group.map(apt => (
                              <th key={apt.id} style={{
                                textAlign: "right", padding: "9px 12px", fontSize: 10.5, fontWeight: 600, whiteSpace: "nowrap",
                                color: apt.id === groupCheapestId ? "var(--green)" : apt.id === groupExpensiveId ? "var(--coral)" : "var(--dark)"
                              }}>
                                <div>{apt.name || `Apt`}</div>
                                {apt.unit && <div style={{ fontSize: 8.5, fontWeight: 400, color: "#a8a098", marginTop: 1 }}>Unit {apt.unit}</div>}
                                {apt.id === groupCheapestId && <div style={{ fontSize: 8, color: "var(--green)", letterSpacing: 0.5, marginTop: 1 }}>✓ BEST</div>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {COST_CATEGORIES.map(cat => {
                            if (!group.some(a => parseFloat(a.costs[cat.key]) > 0)) return null;
                            return (
                              <tr key={cat.key} style={{ borderBottom: "1px solid #f2efe9" }}>
                                <td style={{ padding: "7px 14px", color: "#3a3a3a" }}><span style={{ marginRight: 6 }}>{cat.icon}</span>{cat.label}</td>
                                {group.map(apt => {
                                  const v = parseFloat(apt.costs[cat.key]) || 0;
                                  const isMin = groupCheapPerCat[cat.key] === apt.id;
                                  return (
                                    <td key={apt.id} className={isMin ? "comp-cheapest" : ""} style={{
                                      textAlign: "right", padding: "7px 12px",
                                      color: v === 0 ? "#ccc" : "var(--dark)", fontWeight: v > 0 ? 500 : 400,
                                      borderRadius: isMin ? 6 : 0
                                    }}>
                                      {v > 0 ? `$${v.toLocaleString()}` : "—"}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                          {/* Total row */}
                          <tr style={{ background: "#faf8f5", borderTop: "2px solid var(--dark)" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 700, fontSize: 12.5 }}>💰 True Total</td>
                            {group.map(apt => (
                              <td key={apt.id} style={{
                                textAlign: "right", padding: "10px 12px", fontWeight: 700,
                                fontFamily: "'DM Serif Display', serif", fontSize: 15,
                                color: apt.id === groupCheapestId ? "var(--green)" : apt.id === groupExpensiveId ? "var(--coral)" : "var(--dark)"
                              }}>${getTotal(apt).toLocaleString()}</td>
                            ))}
                          </tr>
                          {/* $/sqft row */}
                          {group.some(a => a.sqft && getTotal(a) > 0) && (
                            <tr style={{ borderTop: "1px solid var(--border)" }}>
                              <td style={{ padding: "7px 14px", color: "var(--gray)", fontSize: 11 }}>Cost / Sq Ft</td>
                              {group.map(apt => { const t = getTotal(apt), sq = Number(apt.sqft); return <td key={apt.id} style={{ textAlign: "right", padding: "7px 12px", color: "var(--gray)", fontSize: 11 }}>{sq && t > 0 ? `$${(t/sq).toFixed(2)}/sqft` : "—"}</td>; })}
                            </tr>
                          )}
                          {/* Move-in row */}
                          {group.some(a => getMoveInTotal(a) > 0) && (
                            <tr style={{ borderTop: "1px solid var(--border)", background: "rgba(122,156,189,0.04)" }}>
                              <td style={{ padding: "7px 14px", color: "var(--blue)", fontSize: 11, fontWeight: 500 }}>📋 Move-In</td>
                              {group.map(apt => { const mi = getMoveInTotal(apt); return <td key={apt.id} style={{ textAlign: "right", padding: "7px 12px", color: mi > 0 ? "var(--blue)" : "#ccc", fontSize: 11, fontWeight: mi > 0 ? 500 : 400 }}>{mi > 0 ? `$${mi.toLocaleString()}` : "—"}</td>; })}
                            </tr>
                          )}
                          {/* Date available row */}
                          {group.some(a => a.dateAvailable) && (
                            <tr style={{ borderTop: "1px solid var(--border)" }}>
                              <td style={{ padding: "7px 14px", color: "var(--gray)", fontSize: 11 }}>📅 Available</td>
                              {group.map(apt => (
                                <td key={apt.id} style={{ textAlign: "right", padding: "7px 12px", color: apt.dateAvailable ? "var(--dark)" : "#ccc", fontSize: 10.5 }}>
                                  {apt.dateAvailable ? formatDate(apt.dateAvailable) : "—"}
                                </td>
                              ))}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Savings callout — only if 2+ in this group */}
                    {group.length >= 2 && (
                      <div style={{ margin: "12px 16px 16px", padding: "11px 14px", borderRadius: 10, background: "var(--green-light)", border: "1px solid rgba(74,154,109,0.2)" }}>
                        <div style={{ fontSize: 12, color: "#2e6b4a", fontWeight: 600 }}>
                          💰 {group[0].name || "Cheapest"} saves <span style={{ color: "var(--green)" }}>${(groupMax - groupMin).toLocaleString()}/mo</span> vs the most expensive in {name}
                        </div>
                        <div style={{ fontSize: 11, color: "#3a7a55", marginTop: 2 }}>
                          That's <strong>${((groupMax - groupMin) * 12).toLocaleString()}/year</strong> within this area alone.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Apartments with no neighborhood set */}
            {filledApts.some(a => !a.neighborhood?.trim()) && (
              <div style={{ marginTop: 8, padding: "14px 18px", borderRadius: 12, background: "var(--gold-light)", border: "1px solid rgba(196,168,130,0.3)" }}>
                <div style={{ fontSize: 11.5, color: "#6a5a3a" }}>
                  📝 {filledApts.filter(a => !a.neighborhood?.trim()).length} apartment{filledApts.filter(a => !a.neighborhood?.trim()).length > 1 ? "s are" : " is"} missing a neighborhood — add one in <strong>Input</strong> to include it here.
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══════ INPUT VIEW ═══════ */}
        {view === "input" && !showComparison && (
          <>
            {apartments.map((apt, idx) => {
              const total = getTotal(apt);
              const moveInTotal = getMoveInTotal(apt);
              const isOpen = activeTab === apt.id;
              const isCheapest = apt.id === cheapestId;
              const isMostExpensive = apt.id === expensiveId;
              const section = activeSection[apt.id] || "costs";

              return (
                <div key={apt.id} className="apt-card" style={{ marginBottom: 12, animationDelay: `${idx * 0.06}s` }}>
                  <div style={{
                    background: "#fff", borderRadius: 16,
                    border: isCheapest ? "1.5px solid var(--green)" : isMostExpensive ? "1.5px solid var(--coral)" : "1.5px solid var(--border)",
                    overflow: "hidden", boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.25s ease, border-color 0.25s ease"
                  }}>
                    {(isCheapest || isMostExpensive) && (
                      <div style={{
                        fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 600,
                        background: isCheapest ? "var(--green-light)" : "var(--coral-light)",
                        color: isCheapest ? "var(--green)" : "var(--coral)", padding: "5px 16px"
                      }}>{isCheapest ? "✓  Lowest True Cost" : "⚠  Highest True Cost"}</div>
                    )}

                    {/* Collapsed header */}
                    <div onClick={() => setActiveTab(isOpen ? null : apt.id)} style={{ cursor: "pointer", padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, userSelect: "none" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 12, background: isOpen ? "var(--dark)" : "var(--cream)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 600, color: isOpen ? "#fff" : "var(--dark)", flexShrink: 0, transition: "all 0.2s ease"
                      }}>{idx + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--dark)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {apt.name || <span style={{ color: "#bbb", fontWeight: 400, fontStyle: "italic" }}>Apartment {idx + 1}</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--gray)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {[
                            apt.neighborhood || null,
                            apt.address || (!apt.neighborhood ? "No address yet" : null),
                            apt.unit ? `Unit ${apt.unit}` : null,
                            apt.bedrooms && apt.sqft ? `${apt.bedrooms}BR · ${Number(apt.sqft).toLocaleString()} sqft` : null,
                          ].filter(Boolean).join(" · ")}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontFamily: "'DM Serif Display', serif", color: total > 0 ? "var(--dark)" : "#ccc" }}>{total > 0 ? `$${total.toLocaleString()}` : "—"}</div>
                        <div style={{ fontSize: 9.5, color: "var(--gray)", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 500 }}>/mo</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#b5afa6", marginLeft: 4, transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</div>
                    </div>

                    {total > 0 && (
                      <div style={{ height: 4, margin: "0 20px", background: "var(--cream)", borderRadius: 2, overflow: "hidden", display: "flex" }}>
                        {COST_CATEGORIES.map(cat => {
                          const v = parseFloat(apt.costs[cat.key]) || 0;
                          const pct = (v / total) * 100;
                          return pct > 0 ? <div key={cat.key} title={`${cat.label}: $${v.toLocaleString()}`} style={{ width: `${pct}%`, background: cat.color, transition: "width 0.4s ease" }} /> : null;
                        })}
                      </div>
                    )}

                    {/* Expanded Body */}
                    <div className={`card-body ${isOpen ? "open" : ""}`}>
                      <div style={{ padding: "22px 20px 20px" }}>

                        {/* Meta fields — 3 rows */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                          <MetaInput label="Name / Label" value={apt.name} onChange={v => update(apt.id, "name", v)} placeholder="e.g. Silver Lake Loft" />
                          <MetaInput label="Neighborhood / Area" value={apt.neighborhood} onChange={v => update(apt.id, "neighborhood", v)} placeholder="e.g. Silver Lake" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 10, marginBottom: 10 }}>
                          <MetaInput label="Street Address" value={apt.address} onChange={v => update(apt.id, "address", v)} placeholder="e.g. 1234 Fountain Ave" />
                          <MetaInput label="Unit #" value={apt.unit} onChange={v => update(apt.id, "unit", v)} placeholder="e.g. 4B" />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 10, marginBottom: 22 }}>
                          <MetaInput label="Bedrooms" value={apt.bedrooms} onChange={v => update(apt.id, "bedrooms", v)} placeholder="e.g. 1" type="number" />
                          <MetaInput label="Square Footage" value={apt.sqft} onChange={v => update(apt.id, "sqft", v)} placeholder="e.g. 650" type="number" />
                          <MetaInput label="Date Available" value={apt.dateAvailable} onChange={v => update(apt.id, "dateAvailable", v)} type="date" />
                        </div>

                        {/* Section toggle */}
                        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                          {["costs", "movein"].map(tab => (
                            <button key={tab} onClick={() => setActiveSection(prev => ({ ...prev, [apt.id]: tab }))} style={{
                              padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 11.5, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                              background: section === tab ? "var(--dark)" : "var(--cream)", color: section === tab ? "#fff" : "var(--gray)", transition: "all 0.2s ease"
                            }}>
                              {tab === "costs" ? "💰 Monthly" : "📋 Move-In"}
                              {tab === "movein" && moveInTotal > 0 && <span style={{ marginLeft: 6, opacity: 0.7 }}>${moveInTotal.toLocaleString()}</span>}
                            </button>
                          ))}
                        </div>

                        {/* Monthly Costs */}
                        {section === "costs" && (
                          <>
                            <div style={{ fontSize: 9.5, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--gray)", fontWeight: 600, marginBottom: 10 }}>Monthly Costs</div>
                            {COST_CATEGORIES.map(cat => {
                              const val = parseFloat(apt.costs[cat.key]) || 0;
                              return (
                                <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: cat.key === "rent" ? "1.5px solid var(--gold)" : "1px solid var(--border)" }}>
                                  <span style={{ fontSize: 17, width: 26, textAlign: "center", flexShrink: 0 }}>{cat.icon}</span>
                                  <span style={{ flex: 1, fontSize: 13, color: cat.key === "rent" ? "var(--dark)" : "#3a3a3a", fontWeight: cat.key === "rent" ? 600 : 400 }}>{cat.label}</span>
                                  <div style={{ position: "relative", width: 108 }}>
                                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb", fontSize: 13, pointerEvents: "none" }}>$</span>
                                    <input type="number" min="0" value={apt.costs[cat.key]} onChange={e => update(apt.id, cat.key, e.target.value)} placeholder="0"
                                      style={{ width: "100%", padding: "7px 10px 7px 24px", border: cat.key === "rent" ? "1.5px solid var(--gold)" : "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: cat.key === "rent" ? "var(--gold-light)" : "var(--warm-white)", color: "var(--dark)", transition: "border-color 0.2s, box-shadow 0.2s" }}
                                    />
                                  </div>
                                  <span style={{ fontSize: 10.5, color: "var(--gray)", width: 36, textAlign: "right", flexShrink: 0 }}>{val > 0 && total > 0 ? `${((val / total) * 100).toFixed(0)}%` : ""}</span>
                                </div>
                              );
                            })}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "2px solid var(--dark)" }}>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>True Monthly Total</span>
                              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "var(--dark)" }}>${total.toLocaleString()}</span>
                            </div>
                            {apt.sqft && total > 0 && <div style={{ textAlign: "right", fontSize: 11, color: "var(--gray)", marginTop: 4 }}>${(total / Number(apt.sqft)).toFixed(2)} per sqft/mo</div>}
                          </>
                        )}

                        {/* Move-In Costs */}
                        {section === "movein" && (
                          <>
                            <div style={{ fontSize: 9.5, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--gray)", fontWeight: 600, marginBottom: 10 }}>Move-In Costs</div>
                            {MOVEIN_FIELDS.map(f => (
                              <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                                <span style={{ fontSize: 17, width: 26, textAlign: "center", flexShrink: 0 }}>{f.icon}</span>
                                <span style={{ flex: 1, fontSize: 13, color: "#3a3a3a" }}>{f.label}</span>
                                <div style={{ position: "relative", width: 108 }}>
                                  <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#bbb", fontSize: 13, pointerEvents: "none" }}>$</span>
                                  <input type="number" min="0" value={apt.movein[f.key]} onChange={e => update(apt.id, f.key, e.target.value)} placeholder="0"
                                    style={{ width: "100%", padding: "7px 10px 7px 24px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "var(--warm-white)", color: "var(--dark)", transition: "border-color 0.2s, box-shadow 0.2s" }}
                                  />
                                </div>
                                <span style={{ width: 36, flexShrink: 0 }} />
                              </div>
                            ))}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 14, borderTop: "2px solid var(--dark)" }}>
                              <span style={{ fontSize: 13, fontWeight: 600 }}>Total Move-In Cost</span>
                              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "var(--dark)" }}>${moveInTotal.toLocaleString()}</span>
                            </div>
                            {total > 0 && moveInTotal > 0 && (
                              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 10, background: "var(--blue-light)", border: "1px solid rgba(122,156,189,0.2)" }}>
                                <span style={{ fontSize: 11.5, color: "#4a6a8a" }}>That's <strong>{(moveInTotal / total).toFixed(1)}×</strong> your monthly cost — breaks even in <strong>{(moveInTotal / total).toFixed(1)} months</strong>.</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Notes */}
                        <div style={{ marginTop: 18 }}>
                          <div style={{ fontSize: 9.5, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--gray)", fontWeight: 600, marginBottom: 6 }}>Notes</div>
                          <textarea value={apt.notes} onChange={e => update(apt.id, "notes", e.target.value)} placeholder="Lease terms, move-in timeline, vibe..."
                            style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 13px", fontSize: 12.5, fontFamily: "'DM Sans', sans-serif", color: "#3a3a3a", resize: "vertical", minHeight: 56, background: "var(--warm-white)", lineHeight: 1.55, transition: "border-color 0.2s, box-shadow 0.2s" }}
                          />
                        </div>

                        {apartments.length > 1 && (
                          <button onClick={() => removeApartment(apt.id)} style={{ marginTop: 16, background: "none", border: "none", color: "var(--coral)", fontSize: 11.5, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", padding: 0, fontWeight: 500 }}>✕ Remove this apartment</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add + Clear */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={addApartment} className="ripple" style={{
                flex: 1, padding: "14px", border: "1.5px dashed var(--border)", borderRadius: 14,
                background: "transparent", cursor: "pointer", color: "var(--gray)", fontFamily: "'DM Sans', sans-serif",
                fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s"
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--gray)"; }}
              ><span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Apartment</button>
              {apartments.length > 1 && (
                <button onClick={clearAll} style={{
                  padding: "14px 16px", border: "1.5px solid var(--border)", borderRadius: 14,
                  background: "transparent", cursor: "pointer", color: "var(--gray)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, transition: "all 0.2s"
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--coral)"; e.currentTarget.style.color = "var(--coral)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--gray)"; }}
                >Reset All</button>
              )}
            </div>
          </>
        )}

        {/* ═══════ COMPARE VIEW ═══════ */}
        {view === "input" && showComparison && filledApts.length > 1 && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1.5px solid var(--border)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            <div style={{ padding: "15px 20px", background: "var(--dark)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 9.5, letterSpacing: 1.8, textTransform: "uppercase", color: "var(--gold)", fontWeight: 600 }}>Side-by-Side Comparison</span>
              <span style={{ fontSize: 9, color: "#a8a098" }}>sorted low → high</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "#faf8f5" }}>
                    <th style={{ textAlign: "left", padding: "10px 16px", color: "var(--gray)", fontWeight: 600, fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.8, width: "36%" }}>Category</th>
                    {sorted.filter(a => getTotal(a) > 0).map(apt => (
                      <th key={apt.id} style={{ textAlign: "right", padding: "10px 12px", fontSize: 10.5, fontWeight: 600, color: apt.id === cheapestId ? "var(--green)" : apt.id === expensiveId ? "var(--coral)" : "var(--dark)", whiteSpace: "nowrap" }}>
                        <div>{apt.name || `Apt ${apartments.findIndex(a => a.id === apt.id) + 1}`}</div>
                        {apt.neighborhood && <div style={{ fontSize: 8.5, fontWeight: 400, color: "var(--gray)", marginTop: 1 }}>📍 {apt.neighborhood}</div>}
                        {apt.unit && <div style={{ fontSize: 8.5, fontWeight: 400, color: "var(--gray)" }}>Unit {apt.unit}</div>}
                        {apt.id === cheapestId && <div style={{ fontSize: 8.5, color: "var(--green)", letterSpacing: 0.5, marginTop: 1 }}>✓ BEST</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COST_CATEGORIES.map(cat => {
                    const fs = sorted.filter(a => getTotal(a) > 0);
                    if (!fs.some(a => parseFloat(a.costs[cat.key]) > 0)) return null;
                    return (
                      <tr key={cat.key} style={{ borderBottom: "1px solid #f2efe9" }}>
                        <td style={{ padding: "8px 16px", color: "#3a3a3a" }}><span style={{ marginRight: 8 }}>{cat.icon}</span>{cat.label}</td>
                        {fs.map(apt => {
                          const v = parseFloat(apt.costs[cat.key]) || 0;
                          const isMin = cheapestPerCat[cat.key] === apt.id;
                          return (
                            <td key={apt.id} className={isMin ? "comp-cheapest" : ""} style={{ textAlign: "right", padding: "8px 12px", color: v === 0 ? "#ccc" : "var(--dark)", fontWeight: v > 0 ? 500 : 400, borderRadius: isMin ? 6 : 0 }}>
                              {v > 0 ? `$${v.toLocaleString()}` : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  <tr style={{ background: "#faf8f5", borderTop: "2px solid var(--dark)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 700, fontSize: 13 }}>💰 True Total</td>
                    {sorted.filter(a => getTotal(a) > 0).map(apt => (
                      <td key={apt.id} style={{ textAlign: "right", padding: "12px 12px", fontWeight: 700, fontFamily: "'DM Serif Display', serif", fontSize: 16, color: apt.id === cheapestId ? "var(--green)" : apt.id === expensiveId ? "var(--coral)" : "var(--dark)" }}>${getTotal(apt).toLocaleString()}</td>
                    ))}
                  </tr>
                  {sorted.some(a => a.sqft && getTotal(a) > 0) && (
                    <tr style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 16px", color: "var(--gray)", fontSize: 11.5 }}>Cost / Sq Ft</td>
                      {sorted.filter(a => getTotal(a) > 0).map(apt => { const t = getTotal(apt), sq = Number(apt.sqft); return <td key={apt.id} style={{ textAlign: "right", padding: "8px 12px", color: "var(--gray)", fontSize: 11.5 }}>{sq && t > 0 ? `$${(t/sq).toFixed(2)}/sqft` : "—"}</td>; })}
                    </tr>
                  )}
                  {sorted.some(a => getMoveInTotal(a) > 0) && (
                    <tr style={{ borderTop: "1px solid var(--border)", background: "rgba(122,156,189,0.04)" }}>
                      <td style={{ padding: "8px 16px", color: "var(--blue)", fontSize: 11.5, fontWeight: 500 }}>📋 Move-In Total</td>
                      {sorted.filter(a => getTotal(a) > 0).map(apt => { const mi = getMoveInTotal(apt); return <td key={apt.id} style={{ textAlign: "right", padding: "8px 12px", color: mi > 0 ? "var(--blue)" : "#ccc", fontSize: 11.5, fontWeight: mi > 0 ? 500 : 400 }}>{mi > 0 ? `$${mi.toLocaleString()}` : "—"}</td>; })}
                    </tr>
                  )}
                  {sorted.some(a => a.dateAvailable) && (
                    <tr style={{ borderTop: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px 16px", color: "var(--gray)", fontSize: 11.5 }}>📅 Available</td>
                      {sorted.filter(a => getTotal(a) > 0).map(apt => (
                        <td key={apt.id} style={{ textAlign: "right", padding: "8px 12px", color: apt.dateAvailable ? "var(--dark)" : "#ccc", fontSize: 11 }}>
                          {apt.dateAvailable ? formatDate(apt.dateAvailable) : "—"}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filledApts.length >= 2 && (
              <div style={{ margin: 16, padding: "14px 18px", borderRadius: 12, background: "var(--green-light)", border: "1px solid rgba(74,154,109,0.25)" }}>
                <div style={{ fontSize: 13, color: "#2e6b4a", fontWeight: 600, marginBottom: 3 }}>
                  💰 {sorted.find(a => getTotal(a) > 0)?.name || "The cheapest option"} saves you <span style={{ color: "var(--green)" }}>${(getTotal(sorted.filter(a=>getTotal(a)>0).pop()) - getTotal(sorted.find(a=>getTotal(a)>0))).toLocaleString()}/mo</span>
                </div>
                <div style={{ fontSize: 12, color: "#3a7a55" }}>That's <strong>${((getTotal(sorted.filter(a=>getTotal(a)>0).pop()) - getTotal(sorted.find(a=>getTotal(a)>0))) * 12).toLocaleString()}/year</strong> compared to the most expensive.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── META INPUT ─── */
function MetaInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <div style={{ fontSize: 9.5, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--gray)", fontWeight: 600, marginBottom: 5 }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", border: "1px solid var(--border)", borderRadius: 9, padding: "8px 11px",
          fontSize: type === "date" ? 11.5 : 12.5, fontFamily: "'DM Sans', sans-serif", color: value ? "var(--dark)" : "var(--gray)",
          background: "var(--warm-white)", transition: "border-color 0.2s, box-shadow 0.2s",
          ...(type === "date" ? { colorScheme: "light" } : {})
        }}
      />
    </div>
  );
}
