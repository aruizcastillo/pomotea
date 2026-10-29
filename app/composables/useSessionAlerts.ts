export function useSessionAlerts() {
  const permission = ref<NotificationPermission | 'unsupported'>('unsupported')
  const failed = ref(false)
  const workerFailed = ref(false)
  let registration: ServiceWorkerRegistration | undefined
  let audio: AudioContext | undefined

  function refreshPermission() {
    permission.value = window.isSecureContext && 'Notification' in window ? Notification.permission : 'unsupported'
  }

  onMounted(() => {
    refreshPermission()
    window.addEventListener('focus', refreshPermission)
    if ('serviceWorker' in navigator && window.isSecureContext) {
      void navigator.serviceWorker.register('/sw.js').then((value) => {
        registration = value
      }).catch(() => { workerFailed.value = true })
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('focus', refreshPermission)
    void audio?.close().catch(() => {})
  })

  // Called directly from a click, before any await, to preserve user activation.
  async function requestPermission() {
    failed.value = false
    refreshPermission()
    if (permission.value === 'unsupported' || permission.value === 'denied') return false
    try {
      permission.value = await Notification.requestPermission()
      return permission.value === 'granted'
    }
    catch {
      failed.value = true
      return false
    }
  }

  async function unlockSound() {
    try {
      audio ??= new AudioContext()
      await audio.resume()
    }
    catch { /* Sound is optional; the visual completion always remains. */ }
  }

  function chime() {
    if (!audio || audio.state !== 'running') return
    const start = audio.currentTime
    for (const [offset, frequency] of [[0, 660], [0.18, 880]] as const) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0, start + offset)
      gain.gain.linearRampToValueAtTime(0.13, start + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + offset + 1.2)
      oscillator.connect(gain).connect(audio.destination)
      oscillator.start(start + offset)
      oscillator.stop(start + offset + 1.3)
      oscillator.onended = () => {
        oscillator.disconnect()
        gain.disconnect()
      }
    }
  }

  async function notify(title: string, body: string, id: string, url: string) {
    refreshPermission()
    if (permission.value !== 'granted') return
    const options: NotificationOptions = { body, tag: `pomotea-${id}`, icon: '/icon-192.png', data: { url } }
    try {
      if (registration?.active) {
        await registration.showNotification(title, options)
      }
      else {
        // Desktop fallback. Mobile may reject the constructor; keep the in-app cue.
        const notification = new Notification(title, options)
        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      }
    }
    catch { failed.value = true }
  }

  return { permission, failed, workerFailed, requestPermission, unlockSound, chime, notify }
}
