// add.jsx — lightweight "add recipe" sheet (mock). Exported to window.
const { useState: useStateAdd } = React;

function AddScreen({ onBack }) {
  const [type, setType] = useStateAdd("Recept");
  const [cat, setCat] = useStateAdd("Huvudrätt");
  const cats = ["Huvudrätt", "Förrätt", "Efterrätt", "Bakning", "Frukost", "Dryck", "Förvaring"];
  const labelStyle = { fontSize: 13, fontWeight: 600, color: "var(--muted)", marginBottom: 7, display: "block" };
  const inputStyle = { width: "100%", padding: "12px 14px", borderRadius: 11, border: "1px solid var(--field-bd)", background: "var(--card)", font: "inherit", fontSize: 15, color: "var(--ink)", outline: "none" };
  return (
    <div className="screen-pad" style={{ maxWidth: 680 }}>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600, marginBottom: 18, padding: 0 }}>
        <Icon name="back" size={18} /> Avbryt
      </button>
      <h1 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(26px,4.5vw,34px)", letterSpacing: "-0.025em", color: "var(--ink)", marginBottom: 6 }}>Lägg till i boken</h1>
      <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 26 }}>Dela ett recept eller ett litet kökstips med familjen.</p>

      <div style={{ display: "inline-flex", background: "var(--chip)", borderRadius: 10, padding: 3, gap: 2, marginBottom: 22 }}>
        {["Recept", "Tips"].map((t) => (
          <button key={t} onClick={() => setType(t)} style={{ border: "none", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600, padding: "8px 22px", borderRadius: 8, background: type === t ? "var(--card)" : "transparent", color: type === t ? "var(--ink)" : "var(--muted)", boxShadow: type === t ? "0 1px 3px rgba(0,0,0,.08)" : "none" }}>{t}</button>
        ))}
      </div>

      {/* photo dropzone */}
      <PhotoZone id="draft-photo" editable big label="Lägg till ett foto" className="" style={{ height: 180, borderRadius: "var(--radius)", border: "2px dashed var(--field-bd)", overflow: "hidden", marginBottom: 22 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div><label style={labelStyle}>Titel</label><input style={inputStyle} placeholder="t.ex. Mormors äppelpaj" /></div>
        <div>
          <label style={labelStyle}>Kategori</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)} style={{ border: "1px solid " + (cat === c ? "var(--accent)" : "var(--card-bd)"), cursor: "pointer", font: "inherit", fontSize: 13.5, fontWeight: 600, padding: "7px 14px", borderRadius: 999, background: cat === c ? "var(--accent)" : "var(--card)", color: cat === c ? "#fff" : "var(--ink)" }}>{c}</button>
            ))}
          </div>
        </div>
        <div><label style={labelStyle}>{type === "Tips" ? "Tipset" : "Ingredienser"}</label><textarea style={{ ...inputStyle, minHeight: 96, resize: "vertical", lineHeight: 1.5 }} placeholder={type === "Tips" ? "Skriv ditt knep…" : "En ingrediens per rad…"} /></div>
        {type === "Recept" && <div><label style={labelStyle}>Gör så här</label><textarea style={{ ...inputStyle, minHeight: 96, resize: "vertical", lineHeight: 1.5 }} placeholder="Ett steg per rad…" /></div>}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
        <button onClick={onBack} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 26px", cursor: "pointer", font: "inherit", fontSize: 15.5, fontWeight: 600 }}>Spara i boken</button>
        <button onClick={onBack} style={{ background: "var(--card)", color: "var(--ink)", border: "1px solid var(--card-bd)", borderRadius: 12, padding: "13px 22px", cursor: "pointer", font: "inherit", fontSize: 15.5, fontWeight: 600 }}>Avbryt</button>
      </div>
    </div>
  );
}

Object.assign(window, { AddScreen });
