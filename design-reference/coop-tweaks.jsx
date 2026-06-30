/* C.O.O.P. — Tweaks layer (only visible when Tweaks is toggled on) */

const COOP_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "commander": "Cameron",
  "accents": ["#d8a94b", "#f0cd84"],
  "glow": 1,
  "motion": true,
  "particles": true
}/*EDITMODE-END*/;

function CoopTweaks() {
  const [t, setTweak] = useTweaks(COOP_TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement.style;
    const accents = Array.isArray(t.accents) ? t.accents : COOP_TWEAK_DEFAULTS.accents;
    r.setProperty("--gold", accents[0]);
    r.setProperty("--gold-hi", accents[1]);
    r.setProperty("--glow-mult", String(t.glow));
    document.body.classList.toggle("no-motion", !t.motion);
    document.body.classList.toggle("no-particles", !t.particles);
    window.dispatchEvent(new CustomEvent("coop:tweaks", { detail: t }));
  }, [t]);

  return (
    <TweaksPanel>
      <TweakSection label="Identity" />
      <TweakText
        label="Address you as"
        value={t.commander}
        onChange={(v) => setTweak("commander", v)}
      />
      <TweakSection label="Atmosphere" />
      <TweakColor
        label="Signature accent"
        value={t.accents}
        options={[
          ["#d8a94b", "#f0cd84"],
          ["#c8923a", "#e6b86a"],
          ["#cfa85f", "#efd9a0"]
        ]}
        onChange={(v) => setTweak("accents", v)}
      />
      <TweakSlider
        label="Glow intensity"
        value={t.glow}
        min={0}
        max={1.6}
        step={0.1}
        onChange={(v) => setTweak("glow", v)}
      />
      <TweakToggle
        label="Ambient drift"
        value={t.motion}
        onChange={(v) => setTweak("motion", v)}
      />
      <TweakToggle
        label="Particle field"
        value={t.particles}
        onChange={(v) => setTweak("particles", v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<CoopTweaks />);
