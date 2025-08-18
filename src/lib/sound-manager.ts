
// MALLEX Sound Manager
export class SoundManager {
  private static audioContext: AudioContext | null = null
  private static initialized = false
  private static soundCache = new Map<string, AudioBuffer>()

  static async init(): Promise<void> {
    try {
      // Initialize AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      this.initialized = true
      console.log('🔊 SoundManager initialized')
    } catch (error) {
      console.warn('SoundManager init failed (non-critical):', error)
      this.initialized = false
    }
  }

  static isInitialized(): boolean {
    return this.initialized && this.audioContext !== null
  }

  static async playSound(soundId: string, volume: number = 0.5): Promise<void> {
    if (!this.isInitialized()) {
      await this.init()
    }

    try {
      // Placeholder for sound playing logic
      console.log(`🎵 Playing sound: ${soundId} at volume ${volume}`)
    } catch (error) {
      console.warn(`Failed to play sound ${soundId}:`, error)
    }
  }

  static setVolume(volume: number): void {
    // Placeholder for volume control
    console.log(`🔊 Volume set to: ${volume}`)
  }

  static destroy(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.soundCache.clear()
    this.initialized = false
    console.log('🔇 SoundManager destroyed')
  }
}
