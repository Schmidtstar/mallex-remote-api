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

  // Preload Audio with error handling
  useEffect(() => {
    const sounds = [
      { ref: drum, src: "/sounds/drum_hit.mp3", volume: 0.7 },
      { ref: gate, src: "/sounds/gate_creak.mp3", volume: 0.6 },
      { ref: burst, src: "/sounds/light_burst.mp3", volume: 0.8 },
      { ref: fanfare, src: "/sounds/fanfare.mp3", volume: 0.9 },
      { ref: confetti, src: "/sounds/confetti.mp3", volume: 0.5 }
    ];

    sounds.forEach(({ ref, src, volume }) => {
      try {
        ref.current = new Audio(src);
        ref.current.volume = volume;
        ref.current.preload = "auto";
        
        // Preload for smoother playback
        ref.current.load();
        
        // Handle load errors gracefully
        ref.current.addEventListener('error', () => {
          console.warn(`Sound file not found: ${src}`);
        });
        
        // Enable better mobile support
        ref.current.addEventListener('canplaythrough', () => {
          console.log(`Sound loaded: ${src}`);
        });
      } catch (error) {
        console.warn(`Failed to load sound: ${src}`, error);
      }
    });

    // Cleanup on unmount
    return () => {
      sounds.forEach(({ ref }) => {
        if (ref.current) {
          ref.current.src = '';
          ref.current = null;
        }
      });
    };
  }, []);

  // Safe sound playing helper
  const playSound = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to beginning
      audioRef.current.play().catch(err => {
        console.warn('Sound play failed:', err);
      });
    }
  };

  // Start Sequenz nach User-Klick
  const startIntro = () => {
    setPhase("idle");

    // t=0.8s - Tiefer Trommelschlag (Atmosphäre aufbauen)
    setTimeout(() => playSound(drum), 800);

    // t=1.2s - Türen öffnen sich + Knarrgeräusch
    setTimeout(() => {
      setPhase("reveal");
      playSound(gate);
    }, 1200);

    // t=2.0s - Helles Licht bricht heraus + Burst-Sound
    setTimeout(() => {
      lightRef.current?.classList.add(s.flash);
      playSound(burst);
    }, 2000);

    // t=2.1s - Epische Fanfare für MALLEX-Enthüllung
    setTimeout(() => playSound(fanfare), 2100);

    // t=2.4s - Lorbeer-Konfetti schießt heraus
    setTimeout(() => {
      confettiRef.current?.classList.add(s.shoot);
      playSound(confetti);
    }, 2400);

    // t=3.4s - Content wird angezeigt (Ribbon + Zitat + Kacheln)
    setTimeout(() => setPhase("content"), 3400);
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