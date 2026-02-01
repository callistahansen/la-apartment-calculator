import { useState, useMemo } from "react";

const COST_CATEGORIES = [
  { key: "rent", label: "Rent", icon: "🏠", placeholder: "e.g. 2400", required: true },
  { key: "parking", label: "Parking", icon: "🅿️", placeholder: "e.g. 250" },
  { key: "electricity", label: "Electricity", icon: "⚡", placeholder: "e.g. 120" },
  { key: "gas", label: "Gas", icon: "🔥", placeholder: "e.g. 60" },
  { key: "water", label: "Water", icon: "💧", placeholder: "e.g. 45" },
  { key: "internet", label: "Internet", icon: "📶", placeholder: "e.g. 70" },
  { key: "trash", label: "Trash / Waste", icon: "🗑️", placeholder: "e.g. 40" },
  { key: "insurance", label: "Renter's Insurance", icon: "🛡️", placeholder: "e.g. 25" },
  { key: "laundry", label: "Laundry", icon: "👕", placeholder: "e.g. 60" },
  { key: "storage", label: "Storage Unit", icon: "📦", placeholder: "e.g. 80" },
  { key: "other", label: "Other", icon: "✦", placeholder: "e.g. 50" },
];

const emptyApartment = () => ({
  id: Date.now(),
  name: "",
  address: "",
  sqft: "",
  bedrooms: "",
  costs: Object.fromEntries(COST_CATEGORIES.map(c => [c.key, ""])),
  notes: "",
});

export default function App() {
  const [apartments, setApartments] = useState([emptyApartment()]);
  const [activeTab, setActiveTab] = useState(null); // id of expanded apartment
  const [showComparison, setShowComparison] = useState(false);

  const updateApartment = (id, field, value) => {
    setApartments(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        if (COST_CATEGORIES.find(c => c.key === field)) {
          return { ...a, costs: { ...a.costs, [field]: value } };
        }
        return { ...a, [field]: value };
      })
    );
  };

  const addApartment = () => {
    const n = emptyApartment();
    setApartments(prev => [...prev, n]);
    setActiveTab(n.id);
  };

  const removeApartment = (id) => {
    setApartments(prev => prev.filter(a => a.id !== id));
    if (activeTab === id) setActiveTab(null);
  };

  const getTotal = (apt) =>
    COST_CATEGORIES.reduce((sum, c) => sum + (parseFloat(apt.costs[c.key]) || 0), 0);

  const sorted = useMemo(() => {
    return [...apartments].sort((a, b) => getTotal(a) - getTotal(b));
  }, [apartments]);

  const cheapest = sorted.length > 0 && getTotal(sorted[0]) > 0 ? sorted[0].id : null;
  const mostExpensive = sorted.length > 0 && getTotal(sorted[sorted.length - 1]) > 0 ? sorted[sorted.length - 1].id : null;

  const maxTotal = Math.max(...apartments.map(getTotal), 1);

  return (
    <div style={{ minHeight: "100vh", background: "#f4f1ec", fontFamily: "'Georgia', serif", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{
        background: "#1a1a1a",
        color: "#f4f1ec",
        padding: "36px 28px 28px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -60, right: -40, width: 220, height: 220,
          borderRadius: "50%", border: "1px solid rgba(244,241,236,0.08)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", top: -30, right: 10, width: 140, height: 140,
          borderRadius: "50%", border: "1px solid rgba(244,241,236,0.06)",
          pointerEvents: "none"
        }} />
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", color: "#8a7f72", marginBottom: 8, fontFamily: "sans-serif" }}>
          Los Angeles · Apartment Finder
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 400, margin: 0, letterSpacing: -0.5, lineHeight: 1.2 }}>
          True Monthly Cost<span style={{ color: "#c4a882" }}> Calculator</span>
        </h1>
        <p style={{ fontSize: 13, color: "#7a7068", margin: "10px 0 0", fontFamily: "sans-serif", lineHeight: 1.5 }}>
          Compare the real all-in cost of every apartment you're considering — beyond just the listed rent.
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px 60px" }}>

        {/* Apartment Cards */}
        {apartments.map((apt, idx) => {
          const total = getTotal(apt);
          const isOpen = activeTab === apt.id;
          const isCheapest = apt.id === cheapest && apartments.length > 1;
          const isMostExpensive = apt.id === mostExpensive && apartments.length > 1;

          return (
            <div key={apt.id} style={{ marginBottom: 12 }}>
              {/* Card Shell */}
              <div style={{
                background: "#fff",
                borderRadius: 14,
                border: isCheapest ? "1.5px solid #4a9a6d" : isMostExpensive ? "1.5px solid #c07060" : "1.5px solid #e8e3dc",
                overflow: "hidden",
                boxShadow: isOpen ? "0 4px 24px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.2s ease"
              }}>
                {/* Badge row */}
                {(isCheapest || isMostExpensive) && (
                  <div style={{
                    fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase",
                    fontFamily: "sans-serif", fontWeight: 600,
                    background: isCheapest ? "rgba(74,154,109,0.1)" : "rgba(192,112,96,0.1)",
                    color: isCheapest ? "#3a7a55" : "#a05040",
                    padding: "5px 14px"
                  }}>
                    {isCheapest ? "✓ Lowest True Cost" : "⚠ Highest True Cost"}
                  </div>
                )}

                {/* Collapse Header */}
                <div
                  onClick={() => setActiveTab(isOpen ? null : apt.id)}
                  style={{ cursor: "pointer", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "#f4f1ec", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {apt.name || <span style={{ color: "#aaa", fontWeight: 400, fontStyle: "italic" }}>Apartment {idx + 1}</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: "#8a7f72", fontFamily: "sans-serif", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {apt.address || "No address yet"}
                      {apt.sqft && apt.bedrooms ? ` · ${apt.bedrooms}BR · ${apt.sqft} sq ft` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: total > 0 ? "#1a1a1a" : "#ccc", letterSpacing: -0.3 }}>
                      ${total > 0 ? total.toLocaleString() : "—"}
                    </div>
                    <div style={{ fontSize: 10, color: "#8a7f72", fontFamily: "sans-serif", textTransform: "uppercase", letterSpacing: 1 }}>
                      /month
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: "#b0a89c", marginLeft: 2, transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>
                    ▼
                  </div>
                </div>

                {/* Cost Bar */}
                {total > 0 && (
                  <div style={{ height: 3, background: "#f4f1ec", margin: "0 18px" }}>
                    <div style={{
                      height: "100%",
                      width: `${(total / maxTotal) * 100}%`,
                      background: isCheapest ? "#4a9a6d" : isMostExpensive ? "#c07060" : "#c4a882",
                      borderRadius: 2,
                      transition: "width 0.4s ease"
                    }} />
                  </div>
                )}

                {/* Expanded Body */}
                {isOpen && (
                  <div style={{ padding: "20px 18px 18px" }}>
                    {/* Meta Fields */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                      <FieldInput label="Name / Label" value={apt.name} onChange={v => updateApartment(apt.id, "name", v)} placeholder="e.g. Silver Lake Loft" />
                      <FieldInput label="Address" value={apt.address} onChange={v => updateApartment(apt.id, "address", v)} placeholder="e.g. 1234 Fountain Ave" />
                      <FieldInput label="Bedrooms" value={apt.bedrooms} onChange={v => updateApartment(apt.id, "bedrooms", v)} placeholder="e.g. 1" />
                      <FieldInput label="Square Footage" value={apt.sqft} onChange={v => updateApartment(apt.id, "sqft", v)} placeholder="e.g. 650" />
                    </div>

                    <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a7f72", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 10 }}>
                      Monthly Costs
                    </div>

                    {/* Cost Inputs */}
                    {COST_CATEGORIES.map(cat => {
                      const val = parseFloat(apt.costs[cat.key]) || 0;
                      return (
                        <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f0ece6" }}>
                          <span style={{ fontSize: 16, width: 24, textAlign: "center", flexShrink: 0 }}>{cat.icon}</span>
                          <span style={{ flex: 1, fontSize: 13, fontFamily: "sans-serif", color: "#3a3a3a" }}>{cat.label}</span>
                          <div style={{ position: "relative", width: 110 }}>
                            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 13, fontFamily: "sans-serif" }}>$</span>
                            <input
                              type="number"
                              min="0"
                              value={apt.costs[cat.key]}
                              onChange={e => updateApartment(apt.id, cat.key, e.target.value)}
                              placeholder={cat.placeholder.replace("e.g. ", "")}
                              style={{
                                width: "100%", boxSizing: "border-box",
                                paddingLeft: 24, paddingRight: 10, padding: "7px 10px 7px 24px",
                                border: cat.key === "rent" ? "1.5px solid #c4a882" : "1px solid #e8e3dc",
                                borderRadius: 8, fontSize: 13, fontFamily: "sans-serif",
                                background: cat.key === "rent" ? "#fffdf8" : "#fff",
                                outline: "none", color: "#1a1a1a"
                              }}
                            />
                          </div>
                          {val > 0 && (
                            <span style={{ fontSize: 11, color: "#8a7f72", fontFamily: "sans-serif", width: 38, textAlign: "right" }}>
                              {((val / total) * 100).toFixed(0)}%
                            </span>
                          )}
                          {val === 0 && <span style={{ width: 38 }} />}
                        </div>
                      );
                    })}

                    {/* Total Row */}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      marginTop: 14, paddingTop: 14, borderTop: "2px solid #1a1a1a"
                    }}>
                      <span style={{ fontSize: 14, fontFamily: "sans-serif", fontWeight: 600, color: "#1a1a1a" }}>True Monthly Total</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a", letterSpacing: -0.5 }}>
                        ${total.toLocaleString()}
                      </span>
                    </div>

                    {/* Cost per sqft */}
                    {apt.sqft && total > 0 && (
                      <div style={{ textAlign: "right", fontSize: 11.5, color: "#8a7f72", fontFamily: "sans-serif", marginTop: 4 }}>
                        ${(total / parseInt(apt.sqft)).toFixed(2)} per sq ft/mo
                      </div>
                    )}

                    {/* Notes */}
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a7f72", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 6 }}>Notes</div>
                      <textarea
                        value={apt.notes}
                        onChange={e => updateApartment(apt.id, "notes", e.target.value)}
                        placeholder="Lease terms, move-in costs, commute time, vibe notes..."
                        style={{
                          width: "100%", boxSizing: "border-box", border: "1px solid #e8e3dc", borderRadius: 8,
                          padding: "10px 12px", fontSize: 12.5, fontFamily: "sans-serif", color: "#3a3a3a",
                          resize: "vertical", minHeight: 60, background: "#fefdfb", outline: "none", lineHeight: 1.5
                        }}
                      />
                    </div>

                    {/* Remove Button */}
                    {apartments.length > 1 && (
                      <button
                        onClick={() => removeApartment(apt.id)}
                        style={{
                          marginTop: 14, background: "none", border: "none", color: "#c07060",
                          fontSize: 12, fontFamily: "sans-serif", cursor: "pointer", padding: 0
                        }}
                      >
                        ✕ Remove this apartment
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Button */}
        <button
          onClick={addApartment}
          style={{
            width: "100%", padding: "14px", border: "1.5px dashed #cfc8be", borderRadius: 14,
            background: "transparent", cursor: "pointer", color: "#8a7f72", fontFamily: "sans-serif",
            fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "all 0.2s"
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#c4a882"; e.currentTarget.style.color = "#c4a882"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#cfc8be"; e.currentTarget.style.color = "#8a7f72"; }}
        >
          <span style={{ fontSize: 18 }}>+</span> Add Another Apartment
        </button>

        {/* Side-by-Side Comparison Toggle */}
        {apartments.length > 1 && apartments.some(a => getTotal(a) > 0) && (
          <div style={{ marginTop: 28 }}>
            <button
              onClick={() => setShowComparison(!showComparison)}
              style={{
                width: "100%", padding: "13px 18px", background: showComparison ? "#1a1a1a" : "#fff",
                border: "1.5px solid #1a1a1a", borderRadius: 12, cursor: "pointer",
                color: showComparison ? "#f4f1ec" : "#1a1a1a", fontFamily: "sans-serif",
                fontSize: 13, fontWeight: 600, letterSpacing: 0.3, transition: "all 0.2s"
              }}
            >
              {showComparison ? "Hide Comparison Table" : "View Side-by-Side Comparison →"}
            </button>

            {showComparison && (
              <div style={{ marginTop: 16, background: "#fff", borderRadius: 14, border: "1.5px solid #e8e3dc", overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid #eae6e0", background: "#faf8f5" }}>
                  <span style={{ fontSize: 10.5, letterSpacing: 1.5, textTransform: "uppercase", color: "#8a7f72", fontFamily: "sans-serif", fontWeight: 600 }}>
                    Cost Comparison
                  </span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, fontFamily: "sans-serif" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #eae6e0" }}>
                        <th style={{ textAlign: "left", padding: "10px 14px", color: "#8a7f72", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8 }}>Category</th>
                        {sorted.map(apt => (
                          <th key={apt.id} style={{ textAlign: "right", padding: "10px 14px", color: apt.id === cheapest ? "#3a7a55" : "#3a3a3a", fontWeight: 600, fontSize: 11.5, whiteSpace: "nowrap" }}>
                            {apt.name || `Apt ${apartments.findIndex(a => a.id === apt.id) + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {COST_CATEGORIES.map((cat, i) => {
                        const vals = sorted.map(a => parseFloat(a.costs[cat.key]) || 0);
                        const hasAny = vals.some(v => v > 0);
                        if (!hasAny) return null;
                        return (
                          <tr key={cat.key} style={{ borderBottom: "1px solid #f2efe9" }}>
                            <td style={{ padding: "8px 14px", color: "#3a3a3a" }}>
                              <span style={{ marginRight: 7 }}>{cat.icon}</span>{cat.label}
                            </td>
                            {sorted.map(apt => {
                              const v = parseFloat(apt.costs[cat.key]) || 0;
                              return (
                                <td key={apt.id} style={{ textAlign: "right", padding: "8px 14px", color: v === 0 ? "#ccc" : "#1a1a1a", fontWeight: v > 0 ? 500 : 400 }}>
                                  {v > 0 ? `$${v.toLocaleString()}` : "—"}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {/* Total Row */}
                      <tr style={{ background: "#faf8f5", borderTop: "2px solid #1a1a1a" }}>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: "#1a1a1a", fontSize: 13 }}>True Total</td>
                        {sorted.map(apt => {
                          const t = getTotal(apt);
                          return (
                            <td key={apt.id} style={{
                              textAlign: "right", padding: "11px 14px", fontWeight: 700, fontSize: 14,
                              color: apt.id === cheapest ? "#3a7a55" : apt.id === mostExpensive ? "#c07060" : "#1a1a1a"
                            }}>
                              ${t.toLocaleString()}
                            </td>
                          );
                        })}
                      </tr>
                      {/* $/sqft row */}
                      {sorted.some(a => a.sqft) && (
                        <tr style={{ borderTop: "1px solid #eae6e0" }}>
                          <td style={{ padding: "8px 14px", color: "#8a7f72", fontSize: 11.5 }}>Cost / Sq Ft</td>
                          {sorted.map(apt => {
                            const t = getTotal(apt);
                            const sqft = parseInt(apt.sqft);
                            return (
                              <td key={apt.id} style={{ textAlign: "right", padding: "8px 14px", color: "#8a7f72", fontSize: 11.5 }}>
                                {sqft && t > 0 ? `$${(t / sqft).toFixed(2)}` : "—"}
                              </td>
                            );
                          })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Savings callout */}
                {sorted.length >= 2 && getTotal(sorted[0]) > 0 && getTotal(sorted[sorted.length - 1]) > 0 && (
                  <div style={{
                    margin: 14, padding: "12px 16px", borderRadius: 10,
                    background: "rgba(74,154,109,0.08)", border: "1px solid rgba(74,154,109,0.2)"
                  }}>
                    <span style={{ fontSize: 12.5, color: "#2e6b4a", fontFamily: "sans-serif" }}>
                      💰 Choosing <strong>{sorted[0].name || "the cheapest option"}</strong> saves you{" "}
                      <strong>${(getTotal(sorted[sorted.length - 1]) - getTotal(sorted[0])).toLocaleString()}/mo</strong>
                      {" "}— that's <strong>${((getTotal(sorted[sorted.length - 1]) - getTotal(sorted[0])) * 12).toLocaleString()}/year</strong> compared to the most expensive.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder }) {
  return (
    <div>
      <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: "#8a7f72", fontFamily: "sans-serif", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", boxSizing: "border-box", border: "1px solid #e8e3dc", borderRadius: 8,
          padding: "8px 10px", fontSize: 12.5, fontFamily: "sans-serif", color: "#1a1a1a",
          background: "#fefdfb", outline: "none"
        }}
      />
    </div>
  );
}
