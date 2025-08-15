import { useEffect, useRef, useState } from "react";
import s from "./AppIntro.module.css";

export default function AppIntro() {
  const [phase, setPhase] = useState<"wait"|"idle"|"reveal"|"content">("wait");
  const lightRef = useRef<HTMLDivElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Sound Refs
  const drum = useRef<HTMLAudioElement|null>(null);
  const gate = useRef<HTMLAudioElement|null>(null);
  const burst = useRef<HTMLAudioElement|null>(null);
  const fanfare = useRef<HTMLAudioElement|null>(null);
  const confetti = useRef<HTMLAudioElement|null>(null);

  // Preload Audio
  useEffect(()=>{
    drum.current = new Audio("/sounds/drum_hit.mp3");
    gate.current = new Audio("/sounds/gate_creak.mp3");
    burst.current = new Audio("/sounds/light_burst.mp3");
    fanfare.current = new Audio("/sounds/fanfare.mp3");
    confetti.current = new Audio("/sounds/confetti.mp3");
    // Lautstärke anpassen
    [drum,gate,burst,fanfare,confetti].forEach(ref=>{
      if(ref.current) ref.current.volume = 0.8;
    });
  },[]);

  // Start Sequenz nach User-Klick
  const startIntro = () => {
    setPhase("idle");

    // t=0.8s Drum
    setTimeout(()=> drum.current?.play(), 800);

    // t=1.2s Gate
    setTimeout(()=>{
      setPhase("reveal");
      gate.current?.play();
    }, 1200);

    // t=2.0s Burst
    setTimeout(()=>{
      lightRef.current?.classList.add(s.flash);
      burst.current?.play();
    }, 2000);

    // t=2.1s Fanfare
    setTimeout(()=> fanfare.current?.play(), 2100);

    // t=2.4s Confetti
    setTimeout(()=>{
      confettiRef.current?.classList.add(s.shoot);
      confetti.current?.play();
    }, 2400);

    // t=3.4s Ribbon
    setTimeout(()=> setPhase("content"), 3400);
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

        {/* Fackeln */}
        <div className={`${s.torch} ${s.left}`}><span/></div>
        <div className={`${s.torch} ${s.right}`}><span/></div>

        {/* Lorbeer */}
        <div className={s.laurelLeft}/>
        <div className={s.laurelRight}/>

        {/* Türen */}
        <div className={`${s.door} ${s.left} ${phase==="reveal" ? s.open : ""}`}/>
        <div className={`${s.door} ${s.right} ${phase==="reveal" ? s.open : ""}`}/>

        {/* Licht */}
        <div ref={lightRef} className={s.godRay}/>

        {/* Konfetti */}
        <div ref={confettiRef} className={s.confetti}>
          {Array.from({length:24}).map((_,i)=>(
            <span key={i} style={{["--i" as any]: i}}/>
          ))}
        </div>

        {/* Inhalt */}
        <div className={`${s.inner} ${phase==="content" ? s.show : ""}`}>
          <div className={s.ribbon}>Die olympischen Saufspiele</div>
          <p className={s.quote}>„Mögen die Spiele beginnen!“</p>

          <div className={s.tiles}>
            {[
              {icon:"💪",txt:"Mut"},
              {icon:"🍻",txt:"Rausch"},
              {icon:"🏆",txt:"Ehre"},
              {icon:"⚔️",txt:"Kampf"},
            ].map((k,idx)=>(
              <button key={k.txt} className={s.tile} style={{animationDelay:`${idx*120}ms`}}>
                <span className={s.ic}>{k.icon}</span>
                <span className={s.tx}>{k.txt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}