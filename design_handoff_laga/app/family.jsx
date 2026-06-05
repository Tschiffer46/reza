// family.jsx — Family/group view: members, invite, activity. Exported to window.
const { useState: useStateFam } = React;

function ActivityRow({ item, onOpen }) {
  const m = window.M[item.who];
  const r = window.R[item.target];
  const verb = {
    lagade: { txt: "lagade", icon: "pot" },
    kommenterade: { txt: "kommenterade", icon: "chat" },
    "lade till": { txt: "lade till", icon: "plus" },
    gillade: { txt: "gillade", icon: "heart" },
  }[item.action] || { txt: item.action, icon: "flame" };
  return (
    <button onClick={() => onOpen(r.id)} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
      background: "transparent", border: "none", borderBottom: "1px solid var(--card-bd)",
      padding: "13px 2px", cursor: "pointer", font: "inherit",
    }}>
      <Avatar id={item.who} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.4 }}>
          <b style={{ fontWeight: 600 }}>{m.name === "Du" ? "Du" : m.full}</b>
          <span style={{ color: "var(--muted)" }}> {verb.txt} </span>
          <b style={{ fontWeight: 600 }}>{r.title}</b>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{item.when}</div>
      </div>
      <div style={{ width: 40, height: 40, borderRadius: 9, background: r.img || "var(--thumb-empty)", flexShrink: 0 }} />
    </button>
  );
}

function MemberRow({ m }) {
  // count contributions
  const cookedTotal = window.RECIPES.reduce((s, r) => s + (r.cookedBy.find((c) => c.id === m.id)?.n || 0), 0);
  const added = window.RECIPES.filter((r) => r.author === m.id).length;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderBottom: "1px solid var(--card-bd)" }}>
      <Avatar id={m.id} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <b style={{ fontSize: 15.5, fontWeight: 600, color: "var(--ink)" }}>{m.full}</b>
          {m.role === "Ägare" && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 7px", borderRadius: 6 }}>Ägare</span>}
          {m.role === "Inbjuden" && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", background: "var(--chip)", padding: "2px 7px", borderRadius: 6 }}>Väntar på svar</span>}
        </div>
        <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
          {m.role === "Inbjuden" ? "Inbjudan skickad" : `${added} recept · lagat ${cookedTotal}×`}
        </div>
      </div>
    </div>
  );
}

function FamilyScreen({ onBack, onOpen, bgs, familyBg, chooseBg }) {
  const [copied, setCopied] = useStateFam(false);
  const members = window.FAMILY.members;
  const totalRecipes = window.RECIPES.length;
  const totalCooked = window.RECIPES.reduce((s, r) => s + r.cookedBy.reduce((a, c) => a + c.n, 0), 0);

  function copyLink() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="screen-pad">
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", font: "inherit", fontSize: 14, fontWeight: 600, marginBottom: 18, padding: 0 }}>
        <Icon name="back" size={18} /> Tillbaka
      </button>

      {/* family header card */}
      <div style={{ background: "var(--card)", border: "1px solid var(--card-bd)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 22 }}>
        <PhotoZone id="family-cover" editable label="Lägg till omslagsbild" fallback="linear-gradient(135deg,var(--accent-soft),var(--thumb-empty))" style={{ height: 150 }} />
        <div style={{ padding: "22px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)" }}>Receptbok</div>
            <h1 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: "clamp(26px,4.5vw,36px)", letterSpacing: "-0.025em", color: "var(--ink)", marginTop: 4 }}>{window.FAMILY.name}</h1>
            <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
              <div><span style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "'Schibsted Grotesk',sans-serif" }}>{totalRecipes}</span> <span style={{ fontSize: 13.5, color: "var(--muted)" }}>recept</span></div>
              <div><span style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "'Schibsted Grotesk',sans-serif" }}>{totalCooked}</span> <span style={{ fontSize: 13.5, color: "var(--muted)" }}>tillagningar</span></div>
              <div><span style={{ fontSize: 22, fontWeight: 700, color: "var(--ink)", fontFamily: "'Schibsted Grotesk',sans-serif" }}>{members.filter(m => m.role !== "Inbjuden").length}</span> <span style={{ fontSize: 13.5, color: "var(--muted)" }}>kockar</span></div>
            </div>
          </div>
          <AvatarStack ids={members.filter(m => m.role !== "Inbjuden").map((m) => m.id)} size={44} max={5} />
        </div>
        </div>
      </div>

      {/* invite */}
      <div style={{ background: "var(--accent-soft)", borderRadius: "var(--radius)", padding: "20px 22px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Icon name="users" size={20} color="var(--accent)" />
          <h2 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Bjud in fler</h2>
        </div>
        <p style={{ fontSize: 14, color: "var(--ink)", opacity: 0.8, marginBottom: 14, maxWidth: "46ch" }}>Dela länken så kan mormor, kusiner och bonusfamiljen lägga till sina egna recept i samma bok.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, display: "flex", alignItems: "center", gap: 9, background: "var(--card)", border: "1px solid var(--card-bd)", borderRadius: 10, padding: "11px 14px" }}>
            <Icon name="link" size={16} color="var(--muted)" />
            <span style={{ fontSize: 13.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{window.FAMILY.handle}</span>
          </div>
          <button onClick={copyLink} style={{ background: copied ? "var(--sage)" : "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "11px 20px", cursor: "pointer", font: "inherit", fontSize: 14.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Icon name={copied ? "check" : "link"} size={16} color="#fff" />{copied ? "Kopierad!" : "Kopiera länk"}
          </button>
        </div>
      </div>

      {/* background chooser */}
      <div style={{ background: "var(--card)", border: "1px solid var(--card-bd)", borderRadius: "var(--radius)", padding: "20px 22px", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Icon name="sliders" size={20} color="var(--accent)" />
          <h2 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: 17, color: "var(--ink)" }}>Familjens bakgrund</h2>
        </div>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 14, maxWidth: "46ch" }}>Välj en känsla för er bok — alla i familjen ser samma.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {bgs && Object.entries(bgs).map(([name, val]) => {
            const active = familyBg === name;
            return (
              <button key={name} onClick={() => chooseBg(name)} style={{
                display: "flex", alignItems: "center", gap: 9, cursor: "pointer", font: "inherit",
                background: active ? "var(--accent-soft)" : "var(--bg)", border: "1px solid " + (active ? "var(--accent)" : "var(--card-bd)"),
                borderRadius: 999, padding: "7px 14px 7px 8px", color: active ? "var(--accent)" : "var(--ink)", fontWeight: 600, fontSize: 13.5,
              }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: val[0], boxShadow: "inset 0 0 0 1px rgba(0,0,0,.12)" }} />
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="family-cols">
        {/* members */}
        <section>
          <h2 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: 19, color: "var(--ink)", marginBottom: 8 }}>Medlemmar</h2>
          <div>
            {members.map((m) => <MemberRow key={m.id} m={m} />)}
          </div>
        </section>

        {/* activity */}
        <section>
          <h2 style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: 19, color: "var(--ink)", marginBottom: 8 }}>Senaste i köket</h2>
          <div>
            {window.ACTIVITY.map((a, i) => <ActivityRow key={i} item={a} onOpen={onOpen} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { FamilyScreen });
