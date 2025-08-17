// MALLEX Sound Manager
export export class SoundManager {
  private static audioContext: AudioContext | null = null
  private static sounds: Map<string, AudioBuffer> = new Map()
  private static enabled = true

  static async init() {
    try {
      // @ts-ignore - WebKit compatibility
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()

      // Preload critical sounds
      await this.loadSound('achievement', '/sounds/achievement.mp3')
      await this.loadSound('button_click', '/sounds/click.mp3')
      await this.loadSound('arena_start', '/sounds/arena_start.mp3')
      await this.loadSound('correct', '/sounds/correct.mp3')
      await this.loadSound('wrong', '/sounds/wrong.mp3')

      console.log('🔊 Sound System initialized')
    } catch (error) {
      console.warn('🔇 Sound System disabled:', error)
      this.enabled = false
    }
  }

  private static async loadSound(name: string, url: string) {
    if (!this.audioContext || !this.enabled) return

    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      this.sounds.set(name, audioBuffer)
    } catch (error) {
      console.warn(`🔇 Could not load sound: ${name}`, error)
    }
  }

  static play(soundName: string, volume = 0.5) {
    if (!this.audioContext || !this.enabled || !this.sounds.has(soundName)) return

    try {
      const audioBuffer = this.sounds.get(soundName)!
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()

      source.buffer = audioBuffer
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime)

      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      source.start()
    } catch (error) {
      console.warn(`🔇 Could not play sound: ${soundName}`, error)
    }
  }

  // Spezielle Arena-Sounds
  static playArenaStart() {
    this.play('arena_start', 0.7)
  }

  static playCorrectAnswer() {
    this.play('correct', 0.6)
  }

  static playWrongAnswer() {
    this.play('wrong', 0.4)
  }

  static playAchievement() {
    this.play('achievement', 0.8)
  }

  static playButtonClick() {
    this.play('button_click', 0.3)
  }

  static toggle() {
    this.enabled = !this.enabled
    console.log(`🔊 Sound ${this.enabled ? 'enabled' : 'disabled'}`)
  }

  static isEnabled() {
    return this.enabled
  }
}