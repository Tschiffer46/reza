// app.jsx — shell, navigation, theme wiring, tweaks. Mounts the app.
const { useState: useStateApp, useEffect: useEffectApp } = React;

const ACCENTS = {
  Lera:    { hex: "#c75b39", soft: "#f6e7e1", shadow: "rgba(199,91,57,.4)" },
  Salvia:  { hex: "#3f7d63", soft: "#e5efe9", shadow: "rgba(63,125,99,.38)" },
  Hav:     { hex: "#3f6ea5", soft: "#e5edf6", shadow: "rgba(63,110,165,.38)" },
  Saffran: { hex: "#c2872a", soft: "#f6edda", shadow: "rgba(194,135,42,.4)" },
};
const ACCENT_BY_HEX = Object.fromEntries(Object.values(ACCENTS).map((a) => [a.hex, a]));

// Family-chosen backgrounds [page, empty-thumb tint]
const BGS = {
  Linne:  ["#f6f5f1", "#eceae4"],
  Varm:   ["#faf3e8", "#efe6d6"],
  Dimma:  ["#eef0f2", "#e2e6e9"],
  Salvia: ["#eef2ec", "#dfe7df"],
  Sand:   ["#f3ecdf", "#e7ddca"],
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#c75b39",
  "wordmark": "Laga",
  "cards": "foto"
}/*EDITMODE-END*/;

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={"nav-item" + (active ? " active" : "")}>
      <Icon name={icon} size={21} stroke={active ? 2 : 1.7} />
      <span>{label}</span>
    </button>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [view, setView] = useStateApp({ name: "feed", id: null });
  const [photos, setPhotos] = useStateApp(() => { try { return JSON.parse(localStorage.getItem("laga_photos") || "{}"); } catch (e) { return {}; } });
  const [familyBg, setFamilyBg] = useStateApp(() => localStorage.getItem("laga_bg") || "Linne");

  function setPhoto(id, url) {
    setPhotos((p) => { const n = { ...p, [id]: url }; try { localStorage.setItem("laga_photos", JSON.stringify(n)); } catch (e) {} return n; });
  }
  function chooseBg(name) { setFamilyBg(name); try { localStorage.setItem("laga_bg", name); } catch (e) {} }

  // expose tweak-driven globals read during render
  window.__lagaCase = t.wordmark;
  window.__lagaShowImages = t.cards === "foto";

  // accent theme
  useEffectApp(() => {
    const a = ACCENT_BY_HEX[t.accent] || ACCENTS.Lera;
    const root = document.documentElement;
    root.style.setProperty("--accent", a.hex);
    root.style.setProperty("--accent-soft", a.soft);
    root.style.setProperty("--accent-shadow", a.shadow);
  }, [t.accent]);

  // family background
  useEffectApp(() => {
    const [bg, thumb] = BGS[familyBg] || BGS.Linne;
    const root = document.documentElement;
    root.style.setProperty("--bg", bg);
    root.style.setProperty("--thumb-empty", thumb);
  }, [familyBg]);

  function go(name, id = null) { setView({ name, id }); window.scrollTo({ top: 0 }); const m = document.querySelector(".main-scroll"); if (m) m.scrollTop = 0; }

  const nav = [
    { name: "feed", icon: "home", label: "Hem" },
    { name: "family", icon: "users", label: "Familjen" },
    { name: "add", icon: "plus", label: "Lägg till" },
  ];
  const activeNav = view.name === "recipe" ? "feed" : view.name;

  return (
   <PhotosCtx.Provider value={{ photos, setPhoto }}>
    <div className="shell">
      {/* ===== Desktop sidebar ===== */}
      <aside className="sidebar">
        <div style={{ padding: "4px 6px 22px" }}><Logo size="md" /></div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {nav.map((n) => <NavItem key={n.name} icon={n.icon} label={n.label} active={activeNav === n.name} onClick={() => go(n.name)} />)}
        </nav>
        <div style={{ marginTop: "auto" }}>
          <button onClick={() => go("family")} className="side-family">
            <AvatarStack ids={window.FAMILY.members.filter(m => m.role !== "Inbjuden").map((m) => m.id)} size={28} max={4} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{window.FAMILY.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{window.FAMILY.members.filter(m => m.role !== "Inbjuden").length} medlemmar</div>
            </div>
          </button>
        </div>
      </aside>

      {/* ===== Mobile top bar ===== */}
      <header className="topbar">
        <Logo size="sm" />
        <button onClick={() => go("family")} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
          <AvatarStack ids={window.FAMILY.members.filter(m => m.role !== "Inbjuden").map((m) => m.id)} size={28} max={3} />
        </button>
      </header>

      {/* ===== Main ===== */}
      <main className="main-scroll">
        <div className="main-inner">
          {view.name === "feed" && <FeedScreen onOpen={(id) => go("recipe", id)} onOpenFamily={() => go("family")} />}
          {view.name === "recipe" && <RecipeScreen id={view.id} onBack={() => go("feed")} />}
          {view.name === "family" && <FamilyScreen onBack={() => go("feed")} onOpen={(id) => go("recipe", id)} bgs={BGS} familyBg={familyBg} chooseBg={chooseBg} />}
          {view.name === "add" && <AddScreen onBack={() => go("feed")} />}
        </div>
      </main>

      {/* ===== Mobile bottom nav ===== */}
      <nav className="bottomnav">
        {nav.map((n) => (
          <button key={n.name} onClick={() => go(n.name)} className={"bn-item" + (activeNav === n.name ? " active" : "")}>
            <Icon name={n.icon} size={23} stroke={activeNav === n.name ? 2 : 1.7} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>

      {/* ===== Tweaks ===== */}
      <TweaksPanel>
        <TweakSection label="Identitet" />
        <TweakColor label="Accentfärg" value={t.accent}
          options={Object.values(ACCENTS).map((a) => a.hex)}
          onChange={(v) => setTweak("accent", v)} />
        <TweakRadio label="Logotyp" value={t.wordmark} options={["Laga", "laga"]}
          onChange={(v) => setTweak("wordmark", v)} />
        <TweakSection label="Känsla" />
        <TweakRadio label="Kortstil" value={t.cards} options={["foto", "minimal"]}
          onChange={(v) => setTweak("cards", v)} />
      </TweaksPanel>
    </div>
   </PhotosCtx.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
