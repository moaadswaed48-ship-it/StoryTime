import type { StoriesDict } from '@/i18n/stories-schema'

/**
 * Media Chrome's own labels (aria labels, tooltips, time read-outs) from our typed dictionary, keyed by the
 * English strings Media Chrome looks up (node_modules/media-chrome/dist/lang/en.js). Media Chrome ships no Arabic,
 * Hebrew or Danish: these are ours, in all four languages.
 */
export function chromeLabels(c: StoriesDict['film']['chrome']): Record<string, string> {
  return {
    Play: c.play, play: c.play, Pause: c.pause, pause: c.pause,
    Captions: c.captions, 'closed captions': c.captions, 'Enable captions': c.enableCaptions, 'Disable captions': c.disableCaptions,
    'Enter fullscreen mode': c.enterFullscreen, 'enter fullscreen mode': c.enterFullscreen,
    'Exit fullscreen mode': c.exitFullscreen, 'exit fullscreen mode': c.exitFullscreen,
    Mute: c.mute, mute: c.mute, Unmute: c.unmute, unmute: c.unmute,
    seek: c.seek, 'video player': c.videoPlayer, 'playback time': c.playbackTime, 'media loading': c.loading,
    '{currentTime} of {totalTime}': c.timeOf, '{time} remaining': c.remaining,
    hour: c.hour, hours: c.hours, minute: c.minute, minutes: c.minutes, second: c.second, seconds: c.seconds,
    'Network Error': c.networkError, 'Decode Error': c.decodeError, 'Source Not Supported': c.notSupported,
    'A network error caused the media download to fail.': c.networkError,
    'A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.': c.decodeError,
    'An unsupported error occurred. The server or network failed, or your browser does not support this format.': c.notSupported,
    'video not loaded, unknown time.': c.notLoaded,
  }
}
