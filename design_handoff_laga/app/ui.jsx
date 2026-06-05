// ui.jsx — shared primitives for Laga. Exported to window.
const { useState, useEffect, useRef } = React;

// ---- Icon set (inline, stroke-based, Schibsted-clean) ----
const PATHS = {
  home: "M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M9.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19v-1.5a3.5 3.5 0 0 0-2.7-3.4M15 4.6a3 3 0 0 1 0 5.8",
  plus: "M12 5v14M5 12h14",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.2-3.2",
  heart: "M12 20s-6.5-4.2-9-8.2A4.6 4.6 0 0 1 12 6a4.6 4.6 0 0 1 9 5.8c-2.5 4-9 8.2-9 8.2Z",
  chat: "M4 5h16v10H9l-4 4V5Z",
  back: "M15 5l-7 7 7 7",
  edit: "M4 20h4L19 9l-4-4L4 16v4ZM14 6l4 4",
  trash: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  share: "M16 6l-4-4-4 4M12 2v13M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7",
  check: "M5 12.5l4.5 4.5L19 7",
  pot: "M5 13h14l-1.1 6.1a1.6 1.6 0 0 1-1.6 1.3H7.7a1.6 1.6 0 0 1-1.6-1.3L5 13ZM3.5 13h17M9 13c0-3 1-5.2 3-5.2s3 2.2 3 5.2M12 5.5V4",
  sliders: "M4 8h10M18 8h2M4 16h2M10 16h10M14 6v4M6 14v4",
  sort: "M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l3 3M17 20l-3-3",
  bookmark: "M6 4h12v16l-6-4-6 4V4Z",
  chefhat: "M7 21h10M7 21v-5M17 21v-5M6 16h12a4 4 0 0 0 .5-7.97A5 5 0 0 0 9 5.5 4 4 0 0 0 6 16Z",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M10 19a2 2 0 0 0 4 0",
  link: "M9 15l6-6M10.5 7.5l1-1a3.5 3.5 0 0 1 5 5l-1 1M13.5 16.5l-1 1a3.5 3.5 0 0 1-5-5l1-1",
  x: "M6 6l12 12M18 6 6 18",
  flame: "M12 3c0 3-3 4-3 7a3 3 0 0 0 6 0c0-1-.6-2-1-2.5C15 9 16 11 16 13a4 4 0 1 1-8 0c0-4 4-6 4-10Z",
  filter: "M4 5h16l-6 7v6l-4-2v-4L4 5Z",
};

function Icon({ name, size = 22, stroke = 1.7, fill = "none", color = "currentColor", style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}>
      <path d={PATHS[name]} />
    </svg>
  );
}

// ---- Logo (Märket: pot glyph + wordmark) ----
function Logo({ size = "md", onLight = false }) {
  const dims = { sm: 30, md: 36, lg: 44 }[size] || 36;
  const fs = { sm: 19, md: 23, lg: 30 }[size] || 23;
  const wm = window.__lagaCase || "Laga";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: dims * 0.34 }}>
      <div style={{
        width: dims, height: dims, borderRadius: dims * 0.28, background: "var(--accent)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: "0 2px 6px -2px var(--accent-shadow)",
      }}>
        <Icon name="pot" size={dims * 0.62} stroke={1.7} color="#fff" />
      </div>
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: fs,
          letterSpacing: "-0.02em", color: onLight ? "#fff" : "var(--ink)",
        }}>{wm}</div>
        <div style={{
          fontSize: dims * 0.22, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
          color: onLight ? "rgba(255,255,255,.6)" : "var(--muted)", marginTop: 2,
        }}>vadskavi.nu</div>
      </div>
    </div>
  );
}

// ---- Avatar ----
function Avatar({ id, size = 28, ring = false }) {
  const m = window.M[id];
  if (!m) return null;
  const initial = m.name === "Du" ? "Du" : m.full[0];
  return (
    <div title={m.full} style={{
      width: size, height: size, borderRadius: "50%", background: m.color, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 600,
      fontSize: size * (initial.length > 1 ? 0.36 : 0.44), letterSpacing: "-0.01em",
      boxShadow: ring ? "0 0 0 2px var(--bg), 0 0 0 3px " + m.color + "44" : "none",
      border: ring ? "2px solid var(--card)" : "none",
    }}>{initial}</div>
  );
}

function AvatarStack({ ids, size = 22, max = 4 }) {
  const shown = ids.slice(0, max);
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {shown.map((id, i) => (
        <div key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32, zIndex: max - i }}>
          <div style={{ border: "2px solid var(--card)", borderRadius: "50%" }}>
            <Avatar id={id} size={size} />
          </div>
        </div>
      ))}
      {ids.length > max && (
        <div style={{
          marginLeft: -size * 0.32, width: size, height: size, borderRadius: "50%",
          background: "var(--chip)", color: "var(--muted)", border: "2px solid var(--card)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size * 0.4, fontWeight: 600,
        }}>+{ids.length - max}</div>
      )}
    </div>
  );
}

// ---- Category tag pill ----
function Tag({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: "var(--chip)", fg: "var(--chip-fg)" },
    accent:  { bg: "var(--accent-soft)", fg: "var(--accent)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 7,
      background: t.bg, color: t.fg, whiteSpace: "nowrap", letterSpacing: "0.01em",
    }}>{children}</span>
  );
}

// ---- Cooked-by inline summary ----
function CookedBy({ recipe, size = 18 }) {
  if (!recipe.cookedBy || recipe.cookedBy.length === 0) {
    return <span style={{ fontSize: 12.5, color: "var(--muted)" }}>Ännu inte lagad</span>;
  }
  const total = recipe.cookedBy.reduce((s, c) => s + c.n, 0);
  const lead = window.M[recipe.cookedBy[0].id];
  const extra = recipe.cookedBy.length - 1;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--muted)" }}>
      <AvatarStack ids={recipe.cookedBy.map((c) => c.id)} size={size} max={3} />
      <span><b style={{ color: "var(--ink)", fontWeight: 600 }}>{lead.name}</b>{recipe.cookedBy[0].n > 1 ? " " + recipe.cookedBy[0].n + "×" : ""}{extra > 0 ? " +" + extra : ""}</span>
    </span>
  );
}

// ---- Photo store (shared via context, persisted to localStorage) ----
const PhotosCtx = React.createContext({ photos: {}, setPhoto: () => {} });
function usePhotos() { return React.useContext(PhotosCtx); }

function fileToDataUrl(file, maxDim = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (Math.max(w, h) > maxDim) { const s = maxDim / Math.max(w, h); w = Math.round(w * s); h = Math.round(h * s); }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      try { resolve(c.toDataURL("image/jpeg", quality)); } catch (e) { reject(e); }
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function PhotoZone({ id, editable, fallback, emoji, className, style, label, big }) {
  const { photos, setPhoto } = usePhotos();
  const url = id ? photos[id] : null;
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  async function handle(files) { if (!files || !files[0]) return; try { setPhoto(id, await fileToDataUrl(files[0])); } catch (e) {} }
  const bg = url
    ? { backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: fallback || "var(--thumb-empty)" };

  const showEmpty = !url && (editable || !fallback);
  const empty = showEmpty && (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, color: editable ? "var(--accent)" : "var(--muted)", pointerEvents: "none" }}>
      <Icon name={editable ? "plus" : "chefhat"} size={big ? 32 : 26} stroke={1.5} color={editable ? "var(--accent)" : "var(--muted)"} />
      {editable && label && <span style={{ fontSize: 12.5, fontWeight: 600 }}>{label}</span>}
    </div>
  );

  if (!editable) {
    return <div className={className} style={{ position: "relative", ...bg, ...style }}>{empty}</div>;
  }
  return (
    <div className={className}
      onClick={(e) => { e.stopPropagation(); inputRef.current && inputRef.current.click(); }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files); }}
      style={{ position: "relative", cursor: "pointer", outline: drag ? "2px dashed var(--accent)" : "none", outlineOffset: -4, ...bg, ...style }}>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handle(e.target.files)} />
      {empty}
      {url && (
        <span style={{ position: "absolute", bottom: 12, right: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,.55)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "6px 11px", borderRadius: 999, backdropFilter: "blur(4px)", pointerEvents: "none" }}>
          <Icon name="edit" size={13} color="#fff" /> Byt bild
        </span>
      )}
    </div>
  );
}

Object.assign(window, { Icon, Logo, Avatar, AvatarStack, Tag, CookedBy, PhotosCtx, usePhotos, PhotoZone });
