// recipe.jsx — Recipe detail with social layers. Exported to window.
const { useState: useStateR } = React;

function SectionTitle({ children, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "0 0 14px" }}>
      {icon && <Icon name={icon} size={19} color="var(--accent)" />}
      <h2 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: 19, letterSpacing: "-0.01em", color: "var(--ink)" }}>{children}</h2>
    </div>
  );
}

function NoteCard({ note }) {
  const m = window.M[note.id];
  return (
    <div style={{ display: "flex", gap: 11, padding: "13px 14px", background: "var(--accent-soft)", borderRadius: 13 }}>
      <Avatar id={note.id} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
          <b style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{m.full}</b>
          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{note.date}</span>
        </div>
        <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.45 }}>{note.text}</div>
      </div>
    </div>
  );
}

function CommentCard({ c }) {
  const m = window.M[c.id];
  return (
    <div style={{ display: "flex", gap: 11 }}>
      <Avatar id={c.id} size={30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <b style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{m.name === "Du" ? "Du" : m.full}</b>
          <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{c.date}</span>
        </div>
        <div style={{ fontSize: 14, color: "var(--ink)", lineHeight: 1.45, marginTop: 2 }}>{c.text}</div>
      </div>
    </div>
  );
}

function RecipeScreen({ id, onBack }) {
  const base = window.R[id];
  const [cooked, setCooked] = useStateR(base.cookedBy);
  const [justCooked, setJustCooked] = useStateR(false);
  const [hearts, setHearts] = useStateR(base.hearts || []);
  const [notes, setNotes] = useStateR(base.notes || []);
  const [comments, setComments] = useStateR(base.comments || []);
  const [noteText, setNoteText] = useStateR("");
  const [commentText, setCommentText] = useStateR("");
  const [servings, setServings] = useStateR(base.servings || 4);

  const liked = hearts.includes("du");
  const totalCooked = cooked.reduce((s, c) => s + c.n, 0);

  function markCooked() {
    setCooked((prev) => {
      const mine = prev.find((c) => c.id === "du");
      if (mine) return prev.map((c) => c.id === "du" ? { ...c, n: c.n + 1 } : c);
      return [{ id: "du", n: 1 }, ...prev];
    });
    setJustCooked(true);
    setTimeout(() => setJustCooked(false), 2200);
  }
  function toggleHeart() {
    setHearts((p) => p.includes("du") ? p.filter((x) => x !== "du") : [...p, "du"]);
  }
  function addNote() {
    if (!noteText.trim()) return;
    setNotes((p) => [...p, { id: "du", text: noteText.trim(), date: "just nu" }]);
    setNoteText("");
  }
  function addComment() {
    if (!commentText.trim()) return;
    setComments((p) => [...p, { id: "du", text: commentText.trim(), date: "just nu" }]);
    setCommentText("");
  }

  const scale = base.servings ? servings / base.servings : 1;

  return (
    <div className="recipe-detail">
      {/* hero */}
      <div style={{ position: "relative" }}>
        {window.__lagaShowImages ? (
          <PhotoZone id={base.id} editable big label="Lägg till foto" fallback={base.img} className="recipe-hero" />
        ) : (
          <div className="recipe-hero recipe-hero--min" style={{ background: "var(--accent-soft)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="chefhat" size={40} color="var(--accent)" stroke={1.3} />
            </div>
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="hero-back" aria-label="Tillbaka">
          <Icon name="back" size={20} color="var(--ink)" />
        </button>
      </div>

      <div className="recipe-body">
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
          <Tag tone="accent">{base.tag}</Tag>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>{base.type}</span>
          {base.time && <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--muted)" }}><Icon name="clock" size={14} />{base.time}</span>}
        </div>

        <h1 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(28px,5vw,40px)", letterSpacing: "-0.025em", color: "var(--ink)", lineHeight: 1.05, textWrap: "balance" }}>{base.title}</h1>
        {base.blurb && <p style={{ fontSize: 16, color: "var(--muted)", marginTop: 10, maxWidth: "52ch", lineHeight: 1.5 }}>{base.blurb}</p>}

        {/* cooked + reactions bar */}
        <div className="recipe-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 13, flexWrap: "wrap" }}>
            <button onClick={markCooked} className="btn-cooked" style={{
              display: "inline-flex", alignItems: "center", gap: 8, background: justCooked ? "var(--sage)" : "var(--accent)",
              color: "#fff", border: "none", borderRadius: 12, padding: "12px 20px", cursor: "pointer", font: "inherit",
              fontSize: 15.5, fontWeight: 600, transition: "background .2s, transform .1s",
            }}>
              <Icon name={justCooked ? "check" : "pot"} size={19} color="#fff" />
              {justCooked ? "Lagad! 🎉" : "Jag lagade den"}
            </button>
            <button onClick={toggleHeart} style={{
              display: "inline-flex", alignItems: "center", gap: 7, background: "var(--card)", border: "1px solid var(--card-bd)",
              color: liked ? "var(--accent)" : "var(--ink)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", font: "inherit", fontSize: 15, fontWeight: 600,
            }}>
              <Icon name="heart" size={18} color="var(--accent)" fill={liked ? "var(--accent)" : "none"} stroke={liked ? 0 : 1.7} />
              {hearts.length}
            </button>
            <button className="btn-ghost-icon" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--card)", border: "1px solid var(--card-bd)", color: "var(--ink)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", font: "inherit", fontSize: 15, fontWeight: 600 }}>
              <Icon name="share" size={17} />
            </button>
          </div>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
            {totalCooked > 0 ? (
              <>
                <AvatarStack ids={cooked.map((c) => c.id)} size={26} max={5} />
                <span style={{ fontSize: 13.5, color: "var(--muted)" }}>
                  Lagad <b style={{ color: "var(--ink)" }}>{totalCooked}×</b> i familjen — {cooked.map((c) => window.M[c.id].name + (c.n > 1 ? " " + c.n + "×" : "")).join(", ")}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 13.5, color: "var(--muted)" }}>Bli först i familjen att laga den.</span>
            )}
          </div>
        </div>

        <div className="recipe-cols">
          {/* LEFT: ingredients + steps */}
          <div style={{ minWidth: 0 }}>
            {base.ingredients && (
              <section style={{ marginBottom: 34 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12, flexWrap: "wrap" }}>
                  <SectionTitle icon="bookmark">Ingredienser</SectionTitle>
                  {base.servings && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "var(--card)", border: "1px solid var(--card-bd)", borderRadius: 10, padding: "5px 8px" }}>
                      <button onClick={() => setServings((s) => Math.max(1, s - 1))} className="step-btn">−</button>
                      <span style={{ fontSize: 14, fontWeight: 600, minWidth: 64, textAlign: "center", color: "var(--ink)" }}>{servings} port.</span>
                      <button onClick={() => setServings((s) => s + 1)} className="step-btn">+</button>
                    </div>
                  )}
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 2 }}>
                  {base.ingredients.map((ing, i) => (
                    <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 0", borderBottom: "1px solid var(--card-bd)" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", marginTop: 8, flexShrink: 0 }} />
                      <span style={{ fontSize: 15.5, color: "var(--ink)", lineHeight: 1.45 }}>{scaleIngredient(ing, scale)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {base.steps && (
              <section style={{ marginBottom: 10 }}>
                <SectionTitle icon="chefhat">{base.type === "Tips" ? "Så gör du" : "Gör så här"}</SectionTitle>
                <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
                  {base.steps.map((s, i) => (
                    <li key={i} style={{ display: "flex", gap: 14 }}>
                      <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14.5, fontFamily: "'Schibsted Grotesk',sans-serif" }}>{i + 1}</span>
                      <span style={{ fontSize: 15.5, color: "var(--ink)", lineHeight: 1.55, paddingTop: 3 }}>{s}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {/* RIGHT: family notes + comments */}
          <div className="recipe-social" style={{ minWidth: 0 }}>
            <section style={{ marginBottom: 30 }}>
              <SectionTitle icon="edit">Familjens noteringar</SectionTitle>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: -8, marginBottom: 14 }}>Små tweaks som stannar i familjen.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {notes.length === 0 && <div style={{ fontSize: 14, color: "var(--muted)", fontStyle: "italic" }}>Inga noteringar än — dela ditt knep!</div>}
                {notes.map((n, i) => <NoteCard key={i} note={n} />)}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input value={noteText} onChange={(e) => setNoteText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Lägg till en notering…" style={{ flex: 1, padding: "10px 13px", borderRadius: 10, border: "1px solid var(--field-bd)", background: "var(--card)", font: "inherit", fontSize: 14, color: "var(--ink)", outline: "none" }} />
                <button onClick={addNote} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", cursor: "pointer", fontWeight: 600, font: "inherit", fontSize: 14 }}>Spara</button>
              </div>
            </section>

            <section>
              <SectionTitle icon="chat">Kommentarer</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {comments.length === 0 && <div style={{ fontSize: 14, color: "var(--muted)", fontStyle: "italic" }}>Bli först att kommentera.</div>}
                {comments.map((c, i) => <CommentCard key={i} c={c} />)}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Avatar id="du" size={30} />
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addComment()} placeholder="Skriv en kommentar…" style={{ flex: 1, padding: "10px 13px", borderRadius: 10, border: "1px solid var(--field-bd)", background: "var(--card)", font: "inherit", fontSize: 14, color: "var(--ink)", outline: "none" }} />
                <button onClick={addComment} style={{ background: "var(--card)", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 10, padding: "0 16px", cursor: "pointer", fontWeight: 600, font: "inherit", fontSize: 14 }}>Skicka</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// scale leading quantity in an ingredient string
function scaleIngredient(str, scale) {
  if (scale === 1) return str;
  return str.replace(/^(\d+[.,]?\d*)/, (m) => {
    const v = parseFloat(m.replace(",", ".")) * scale;
    const r = Math.round(v * 10) / 10;
    return (Number.isInteger(r) ? r : r.toFixed(1).replace(".", ",")).toString();
  });
}

Object.assign(window, { RecipeScreen });
