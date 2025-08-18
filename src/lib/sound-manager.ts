// MALLEX Sound Manager
export class SoundManager {
  private static audioContext: AudioContext | null = null
  private static sounds: Map<string, AudioBuffer | null> = new Map()
  private static enabled = true
  private static loadedSounds: Map<string, AudioBuffer | null> = new Map()

  // Define sound paths relative to the public directory
  private static soundPaths = {
    click: '/sounds/click.mp3',
    correct: '/sounds/correct.mp3',
    wrong: '/sounds/wrong.mp3',
    achievement: '/sounds/achievement.mp3',
    arena_start: '/sounds/arena_start.mp3'
  }

  static async init() {
    try {
      // @ts-ignore - WebKit compatibility
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      this.audioContext = new AudioContext()

      // Preload critical sounds using the defined paths
      await this.loadSound('achievement', this.soundPaths.achievement)
      await this.loadSound('button_click', this.soundPaths.click)
      await this.loadSound('arena_start', this.soundPaths.arena_start)
      await this.loadSound('correct', this.soundPaths.correct)
      await this.loadSound('wrong', this.soundPaths.wrong)

      console.log('🔊 Sound System initialized')
    } catch (error) {
      console.warn('🔇 Sound System disabled:', error)
      this.enabled = false
    }
  }

  private static async loadSound(name: string, url: string): Promise<void> {
    if (!this.audioContext || !this.enabled) return

    try {
      // Check if file exists first
      const response = await fetch(url, { method: 'HEAD' })
      if (!response.ok) {
        throw new Error(`Sound file not found: ${url}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
      this.sounds.set(name, audioBuffer)
      this.loadedSounds.set(name, audioBuffer) // Keep track of loaded sounds
    } catch (error) {
      console.warn(`🔇 Could not load sound: ${name} –`, error.message || error)
      this.loadedSounds.set(name, null)

      // Track sound loading errors
      try {
        const { MonitoringService } = require('./monitoring')
        if (MonitoringService?.trackError) {
          MonitoringService.trackError('sound_loading_failed', {
            soundName: name,
            error: error.message
          })
        }
      } catch (e) {
        // Silently fail monitoring
      }
    }
  }

  static play(soundName: string, volume = 0.5) {
    const audioBuffer = this.sounds.get(soundName)
    if (!this.audioContext || !this.enabled || !audioBuffer) return

    try {
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