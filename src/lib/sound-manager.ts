// MALLEX Sound Manager
export class SoundManager {
  private static audioContext: AudioContext | null = null
  private static sounds: Map<string, AudioBuffer | null> = new Map()
  private static enabled = true
  private static loadedSounds: Map<string, AudioBuffer | null> = new Map()
  private static isInitialized = false

  // Define sound paths relative to the public directory
  private static soundPaths = {
    click: '/sounds/click.mp3',
    correct: '/sounds/correct.mp3',
    wrong: '/sounds/wrong.mp3',
    achievement: '/sounds/achievement.mp3',
    arena_start: '/sounds/arena_start.mp3'
  }

  private static isSupported(): boolean {
    return !!(window.AudioContext || window.webkitAudioContext)
  }

  static async init() {
    if (!this.isSupported()) {
      console.warn('🔇 Audio not supported in this environment')
      this.isInitialized = true // Mark as initialized even if not supported
      return
    }

    console.log('🔊 Sound System initializing...')

    // Pre-load critical sounds with graceful failure
    const criticalSounds = ['click', 'correct', 'wrong']
    let loadedCount = 0

    for (const soundKey of criticalSounds) {
      try {
        await this.preloadSound(soundKey as keyof typeof this.soundPaths)
        loadedCount++
      } catch (error) {
        console.warn(`🔇 Could not preload ${soundKey} (non-critical)`)
      }
    }

    this.isInitialized = true

    if (loadedCount > 0) {
      console.log(`🔊 Sound System initialized (${loadedCount}/${criticalSounds.length} sounds loaded)`)
    } else {
      console.log('🔇 Sound System initialized (silent mode - no sounds available)')
    }
  }

  // Helper to preload a single sound
  private static async preloadSound(key: keyof typeof this.soundPaths): Promise<void> {
    if (!this.audioContext) {
      // Initialize AudioContext if it hasn't been already
      // @ts-ignore - WebKit compatibility
      window.AudioContext = window.AudioContext || window.webkitAudioContext
      // @ts-ignore - TypeScript doesn't know about webkitAudioContext
      this.audioContext = new AudioContext()
    }

    const url = this.soundPaths[key]
    if (!url) {
      throw new Error(`Sound path not defined for key: ${key}`)
    }

    try {
      // Fetch the audio file with proper error handling
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Sound file not found at ${url} (Status: ${response.status})`)
      }

      const arrayBuffer = await response.arrayBuffer()

      // Decode audio with better error handling
      try {
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
        this.sounds.set(key, audioBuffer)
        this.loadedSounds.set(key, audioBuffer)
        console.log(`🔊 Successfully loaded sound: ${key}`)
      } catch (decodeError) {
        console.warn(`🔇 Could not load sound: ${key} –`, decodeError.message || 'Decoding failed')

        // Try alternative format
        const alternativeUrl = url.replace('.mp3', '.wav').replace('.wav', '.ogg')
        if (alternativeUrl !== url) {
          try {
            const altResponse = await fetch(alternativeUrl)
            if (altResponse.ok) {
              const altBuffer = await altResponse.arrayBuffer()
              const audioBuffer = await this.audioContext.decodeAudioData(altBuffer)
              this.sounds.set(key, audioBuffer)
              this.loadedSounds.set(key, audioBuffer)
              console.log(`🔊 Alternative format loaded: ${key}`)
              return
            }
          } catch (altError) {
            console.log(`🔇 Alternative format also failed: ${key}`)
          }
        }

        // Set as null - app continues without sound
        this.sounds.set(key, null)
        this.loadedSounds.set(key, null)
        return
      }
    } catch (error) {
      console.warn(`🔇 Could not fetch sound: ${key} from ${url} –`, error.message || error)
      this.sounds.set(key, null)
      this.loadedSounds.set(key, null)

      // Don't throw error for missing sounds - app should continue working
      return
    }
  }

  static play(soundName: string, volume = 0.5) {
    if (!this.isInitialized) {
      console.warn('SoundManager not initialized, cannot play sound.')
      return
    }
    if (!this.enabled) {
      return // Do nothing if sounds are disabled
    }

    const audioBuffer = this.sounds.get(soundName)
    if (!this.audioContext || !audioBuffer) {
      console.warn(`🔊 Sound '${soundName}' not loaded or context unavailable.`)
      return
    }

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
    this.play('click', 0.3) // Corrected sound name to match path definition
  }

  static toggle() {
    this.enabled = !this.enabled
    console.log(`🔊 Sound ${this.enabled ? 'enabled' : 'disabled'}`)
  }

  static isEnabled() {
    return this.enabled
  }

  // Method to check if SoundManager has been initialized
  static getIsInitialized(): boolean {
    return this.isInitialized;
  }
}