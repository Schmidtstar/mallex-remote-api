import { useEffect, useRef, useState } from "react";
import s from "./AppIntro.module.css";
import { SoundGenerator } from "./SoundGenerator";

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

  // Web Audio fallback
  const soundGenerator = useRef<SoundGenerator>(new SoundGenerator());

  // Preload Audio with fallbacks and better error handling
  useEffect(() => {
    const sounds = [
      { ref: drum, src: "/sounds/drum_hit.mp3", volume: 0.7, fallback: true },
      { ref: gate, src: "/sounds/gate_creak.mp3", volume: 0.6, fallback: true },
      { ref: burst, src: "/sounds/light_burst.mp3", volume: 0.8, fallback: true },
      { ref: fanfare, src: "/sounds/fanfare.mp3", volume: 0.9, fallback: true },
      { ref: confetti, src: "/sounds/confetti.mp3", volume: 0.5, fallback: true }
    ];

    sounds.forEach(({ ref, src, volume, fallback }) => {
      try {
        // Test if file exists first
        fetch(src, { method: 'HEAD' })
          .then(response => {
            if (response.ok) {
              ref.current = new Audio(src);
              ref.current.volume = volume;
              ref.current.preload = "metadata";
              
              ref.current.addEventListener('canplaythrough', () => {
                console.log(`✅ Sound loaded: ${src}`);
              });
              
              ref.current.addEventListener('error', (e) => {
                console.warn(`❌ Sound error: ${src}`, e);
                if (fallback) {
                  // Create silent audio as fallback
                  ref.current = null;
                }
              });
              
              // Load the audio
              ref.current.load();
            } else {
              console.warn(`🔇 Sound file not accessible: ${src} (${response.status})`);
              ref.current = null;
            }
          })
          .catch(() => {
            console.warn(`🔇 Sound file not found: ${src}`);
            ref.current = null;
          });
      } catch (error) {
        console.warn(`🔇 Failed to load sound: ${src}`, error);
        ref.current = null;
      }
    });

    // Cleanup on unmount
    return () => {
      sounds.forEach(({ ref }) => {
        if (ref.current) {
          ref.current.pause();
          ref.current.src = '';
          ref.current = null;
        }
      });
    };
  }, []);

  // Safe sound playing helper with Web Audio fallback
  const playSound = async (audioRef: React.RefObject<HTMLAudioElement | null>, soundName: string = "unknown") => {
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
        console.log(`🔊 Playing MP3: ${soundName}`);
      } catch (err) {
        console.warn(`🔇 MP3 failed for ${soundName}, using Web Audio fallback`);
        await playWebAudioFallback(soundName);
      }
    } else {
      console.log(`🔇 No MP3 for ${soundName}, using Web Audio fallback`);
      await playWebAudioFallback(soundName);
    }
  };

  const playWebAudioFallback = async (soundName: string) => {
    const generator = soundGenerator.current;
    try {
      switch (soundName) {
        case "drum": await generator.playDrum(); break;
        case "gate": await generator.playGate(); break;
        case "light burst": await generator.playBurst(); break;
        case "fanfare": await generator.playFanfare(); break;
        case "confetti": await generator.playConfetti(); break;
        default: console.log(`🔇 No fallback for ${soundName}`);
      }
      console.log(`🎵 Web Audio: ${soundName}`);
    } catch (error) {
      console.warn(`🔇 Web Audio failed for ${soundName}:`, error);
    }
  };

  // Start Sequenz nach User-Klick
  const startIntro = () => {
    setPhase("idle");

    // t=0.8s - Tiefer Trommelschlag (Atmosphäre aufbauen)
    setTimeout(() => playSound(drum, "drum"), 800);

    // t=1.2s - Türen öffnen sich + Knarrgeräusch
    setTimeout(() => {
      setPhase("reveal");
      playSound(gate, "gate");
    }, 1200);

    // t=2.0s - Helles Licht bricht heraus + Burst-Sound
    setTimeout(() => {
      lightRef.current?.classList.add(s.flash);
      playSound(burst, "light burst");
    }, 2000);

    // t=2.1s - Epische Fanfare für MALLEX-Enthüllung
    setTimeout(() => playSound(fanfare, "fanfare"), 2100);

    // t=2.4s - Lorbeer-Konfetti schießt heraus
    setTimeout(() => {
      confettiRef.current?.classList.add(s.shoot);
      playSound(confetti, "confetti");
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