import { useState } from "react";
import s from "./AppIntro.module.css";

export default function AppIntro() {
  const [phase, setPhase] = useState<"wait"|"idle"|"reveal">("wait");

  // Start Sequenz nach User-Klick
  const startIntro = () => {
    setPhase("idle");

    // t=1.2s - Türen öffnen sich
    setTimeout(() => {
      setPhase("reveal");
    }, 1200);
  };

  return (
    <section className={s.stage}>
      {phase==="wait" && (
        <div className={s.clickOverlay} onClick={startIntro}>
          <p>Tippe, um die Spiele zu beginnen…</p>
        </div>
      )}

      {/* Himmel + Tempel */}
      <div className={s.sky}/>
      <div className={s.clouds}/>
      <div className={s.temple}>
        <div className={s.pediment}>
          <div className={s.frieze}/>
          <div className={s.title}>MALLEX</div>
        </div>

        {/* Türen */}
        <div className={`${s.door} ${s.left} ${phase==="reveal" ? s.open : ""}`}/>
        <div className={`${s.door} ${s.right} ${phase==="reveal" ? s.open : ""}`}/>
      </div>
    </section>
  );
}