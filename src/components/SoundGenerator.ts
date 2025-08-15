
// Web Audio API based sound generator for fallback
export class SoundGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not available');
    }
  }

  private async ensureContext() {
    if (!this.audioContext) return null;
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    return this.audioContext;
  }

  async playDrum() {
    const context = await this.ensureContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(60, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(30, context.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    oscillator.type = 'sine';
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  }

  async playGate() {
    const context = await this.ensureContext();
    if (!context) return;

    // Brown noise für Knarr-Geräusch
    const bufferSize = context.sampleRate * 0.5;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const source = context.createBufferSource();
    const gainNode = context.createGain();
    
    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(context.destination);
    
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
    
    source.start(context.currentTime);
  }

  async playBurst() {
    const context = await this.ensureContext();
    if (!context) return;

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.setValueAtTime(1200, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(2000, context.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
    
    oscillator.type = 'sawtooth';
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
  }

  async playFanfare() {
    const context = await this.ensureContext();
    if (!context) return;

    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    frequencies.forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(freq, context.currentTime);
      
      gainNode.gain.setValueAtTime(0.15, context.currentTime + index * 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 1.0);
      
      oscillator.type = 'triangle';
      oscillator.start(context.currentTime + index * 0.05);
      oscillator.stop(context.currentTime + 1.0);
    });
  }

  async playConfetti() {
    const context = await this.ensureContext();
    if (!context) return;

    // Mehrere kurze Klicks
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(800 + Math.random() * 400, context.currentTime);
        
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.05);
        
        oscillator.type = 'square';
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.05);
      }, i * 50);
    }
  }
}
