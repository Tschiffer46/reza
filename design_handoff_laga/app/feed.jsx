// feed.jsx — Home / recipe feed. Exported to window.
const { useState: useStateF, useMemo: useMemoF } = React;

function RecipeCard({ recipe, onOpen }) {
  const hearts = recipe.hearts ? recipe.hearts.length : 0;
  const comments = recipe.comments ? recipe.comments.length : 0;
  const showImg = window.__lagaShowImages;

  // ---- Minimal (text-forward) variant ----
  if (!showImg) {
    return (
      <button onClick={() => onOpen(recipe.id)} className="laga-card laga-card--min" style={{
        textAlign: "left", border: "1px solid var(--card-bd)", background: "var(--card)",
        borderRadius: "var(--radius)", cursor: "pointer", padding: "16px 18px",
        display: "flex", flexDirection: "column", gap: 11, font: "inherit", color: "inherit",
        transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag>{recipe.tag}</Tag>
          {recipe.type === "Tips" && <Tag tone="accent">Tips</Tag>}
        </div>
        <div style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 600, fontSize: 19, letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.2, textWrap: "balance" }}>{recipe.title}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <CookedBy recipe={recipe} />
          <div style={{ display: "flex", alignItems: "center", gap: 11, color: "var(--muted)", flexShrink: 0 }}>
            {hearts > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600 }}><Icon name="heart" size={14} color="var(--accent)" fill="var(--accent)" stroke={0} />{hearts}</span>}
            {comments > 0 && <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600 }}><Icon name="chat" size={14} />{comments}</span>}
          </div>
        </div>
      </button>
    );
  }

  // ---- Photo variant ----
  return (
    <button onClick={() => onOpen(recipe.id)} className="laga-card" style={{
      textAlign: "left", border: "1px solid var(--card-bd)", background: "var(--card)",
      borderRadius: "var(--radius)", overflow: "hidden", cursor: "pointer", padding: 0,
      display: "flex", flexDirection: "column", font: "inherit", color: "inherit",
      transition: "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
    }}>
      <div style={{ position: "relative", aspectRatio: "16/10" }}>
        <PhotoZone id={recipe.id} fallback={recipe.img} style={{ position: "absolute", inset: 0 }} />
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <span style={{
            fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: 7,
            background: "rgba(255,255,255,.92)", color: "var(--ink)", backdropFilter: "blur(4px)",
          }}>{recipe.tag}</span>
        </div>
        {recipe.type === "Tips" && (
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 9px", borderRadius: 7, background: "var(--accent)", color: "#fff" }}>Tips</span>
          </div>
        )}
      </div>
      <div style={{ padding: "13px 14px 14px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        <div style={{
          fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 600, fontSize: 17.5,
          letterSpacing: "-0.01em", color: "var(--ink)", lineHeight: 1.2, textWrap: "balance",
        }}>{recipe.title}</div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <CookedBy recipe={recipe} />
          <div style={{ display: "flex", alignItems: "center", gap: 11, color: "var(--muted)", flexShrink: 0 }}>
            {hearts > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                <Icon name="heart" size={14} color="var(--accent)" fill="var(--accent)" stroke={0} />{hearts}
              </span>
            )}
            {comments > 0 && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600 }}>
                <Icon name="chat" size={14} />{comments}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function FeedScreen({ onOpen, onOpenFamily }) {
  const [q, setQ] = useStateF("");
  const [type, setType] = useStateF("Alla");      // Alla / Recept / Tips
  const [cat, setCat] = useStateF("Alla");
  const [sort, setSort] = useStateF("Senaste");

  const list = useMemoF(() => {
    let r = window.RECIPES.slice();
    if (type !== "Alla") r = r.filter((x) => x.type === type);
    if (cat !== "Alla") r = r.filter((x) => x.tag === cat || x.category === cat);
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((x) => x.title.toLowerCase().includes(s) || (x.blurb || "").toLowerCase().includes(s));
    }
    if (sort === "Populärast") r.sort((a, b) => (b.hearts?.length || 0) - (a.hearts?.length || 0));
    if (sort === "Mest lagad") r.sort((a, b) => b.cookedBy.reduce((s, c) => s + c.n, 0) - a.cookedBy.reduce((s, c) => s + c.n, 0));
    return r;
  }, [q, type, cat, sort]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 10) return "God morgon";
    if (h < 14) return "Dags för lunch";
    if (h < 22) return "Vad ska vi laga?";
    return "Sen kvällshunger?";
  })();

  return (
    <div className="screen-pad">
      {/* greeting + family strip */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>{window.FAMILY.name}</div>
          <h1 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(26px,4.5vw,38px)", letterSpacing: "-0.025em", color: "var(--ink)", marginTop: 4, lineHeight: 1.05 }}>{greeting}</h1>
        </div>
        <button onClick={onOpenFamily} className="family-strip" style={{
          display: "flex", alignItems: "center", gap: 9, background: "var(--card)", border: "1px solid var(--card-bd)",
          borderRadius: 999, padding: "6px 6px 6px 14px", cursor: "pointer", color: "var(--muted)", font: "inherit", fontSize: 13, fontWeight: 600,
        }}>
          <span>Familjen</span>
          <AvatarStack ids={window.FAMILY.members.filter(m => m.role !== "Inbjuden").map((m) => m.id)} size={26} max={4} />
        </button>
      </div>

      {/* search */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}><Icon name="search" size={19} /></span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Sök recept & tips…" style={{
          width: "100%", padding: "13px 16px 13px 44px", borderRadius: "var(--radius)", border: "1px solid var(--field-bd)",
          background: "var(--card)", font: "inherit", fontSize: 15.5, color: "var(--ink)", outline: "none",
        }} />
      </div>

      {/* type segmented + sort */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", background: "var(--chip)", borderRadius: 10, padding: 3, gap: 2 }}>
          {["Alla", "Recept", "Tips"].map((t) => (
            <button key={t} onClick={() => setType(t)} style={{
              border: "none", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600, padding: "7px 16px", borderRadius: 8,
              background: type === t ? "var(--card)" : "transparent", color: type === t ? "var(--ink)" : "var(--muted)",
              boxShadow: type === t ? "0 1px 3px rgba(0,0,0,.08)" : "none", transition: "all .15s",
            }}>{t}</button>
          ))}
        </div>
        <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, color: "var(--muted)" }}>
          <Icon name="sort" size={16} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{
            appearance: "none", border: "none", background: "transparent", font: "inherit", fontSize: 14, fontWeight: 600,
            color: "var(--ink)", cursor: "pointer", outline: "none", paddingRight: 4,
          }}>
            <option>Senaste</option>
            <option>Populärast</option>
            <option>Mest lagad</option>
          </select>
        </div>
      </div>

      {/* category chips */}
      <div className="chip-row" style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 22 }}>
        {window.CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} style={{
            border: "1px solid " + (cat === c ? "var(--accent)" : "var(--card-bd)"), cursor: "pointer", font: "inherit",
            fontSize: 13.5, fontWeight: 600, padding: "7px 15px", borderRadius: 999, whiteSpace: "nowrap",
            background: cat === c ? "var(--accent)" : "var(--card)", color: cat === c ? "#fff" : "var(--ink)", transition: "all .15s",
          }}>{c}</button>
        ))}
      </div>

      {/* grid */}
      {list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--muted)" }}>
          <Icon name="search" size={34} color="var(--muted)" />
          <p style={{ marginTop: 12, fontSize: 15 }}>Inga träffar. Prova ett annat ord.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {list.map((r) => <RecipeCard key={r.id} recipe={r} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FeedScreen, RecipeCard });
