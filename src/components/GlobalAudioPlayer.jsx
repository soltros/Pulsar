import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { getApiUrl, getCoverArtUrl, fetchApi } from '../lib/api';

// Create a singleton Audio object completely detached from React's render tree.
// This prevents React re-renders from ever interrupting playback (a common issue on mobile browsers).
const audioObj = new Audio();
audioObj.preload = "auto";

export default function GlobalAudioPlayer() {
  const setAudioRef = usePlayerStore(state => state.setAudioRef);
  const queue = usePlayerStore(state => state.queue);
  const currentIndex = usePlayerStore(state => state.currentIndex);
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const setProgress = usePlayerStore(state => state.setProgress);
  const setDuration = usePlayerStore(state => state.setDuration);
  const playNext = usePlayerStore(state => state.playNext);
  
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const volume = usePlayerStore(state => state.volume);
  const scrobbledTrackIds = useRef(new Set());

  // Expose the audioObj to the store exactly once
  useEffect(() => {
    setAudioRef({ current: audioObj });
  }, [setAudioRef]);

  // Volume
  useEffect(() => {
    audioObj.volume = volume;
  }, [volume]);

  // Handle source changes (when track changes)
  useEffect(() => {
    if (currentTrack) {
      const newSrc = getApiUrl('stream', { id: currentTrack.id });
      // Only set src if it's genuinely different to avoid interrupting current stream
      if (audioObj.src !== newSrc) {
        audioObj.src = newSrc;
        if (isPlaying) {
          audioObj.play().catch(e => console.error("Playback failed:", e));
        }
      }
    }
  }, [currentTrack?.id]);

  // Handle Play/Pause
  useEffect(() => {
    if (isPlaying && currentTrack) {
      if (audioObj.paused && audioObj.src) {
        audioObj.play().catch(e => console.error("Playback failed:", e));
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      if (!audioObj.paused) {
        audioObj.pause();
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, currentTrack?.id]);

  // Handle native audio events
  useEffect(() => {
    const handleTimeUpdate = () => {
      const curTime = audioObj.currentTime;
      const dur = audioObj.duration;
      setProgress(curTime);

      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && dur > 0 && !isNaN(dur) && !isNaN(curTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: audioObj.playbackRate,
            position: curTime
          });
        } catch(e) { /* ignore */ }
      }

      // Scrobble at 50% or 4 minutes
      const state = usePlayerStore.getState();
      const track = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
      if (track && dur > 0 && !scrobbledTrackIds.current.has(track.id)) {
        const scrobblePoint = Math.min(dur / 2, 240);
        if (curTime >= scrobblePoint) {
          scrobbledTrackIds.current.add(track.id);
          fetchApi('scrobble', { id: track.id, submission: true }).catch(console.error);
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audioObj.duration);
    };

    const handleEnded = () => {
      const state = usePlayerStore.getState();
      const track = state.currentIndex >= 0 ? state.queue[state.currentIndex] : null;
      if (track && !scrobbledTrackIds.current.has(track.id)) {
        scrobbledTrackIds.current.add(track.id);
        fetchApi('scrobble', { id: track.id, submission: true }).catch(console.error);
      }
      
      const repeatMode = state.repeatMode;
      let nextTrack = null;
      
      if (repeatMode === 'one') {
        nextTrack = track;
      } else if (state.currentIndex < state.queue.length - 1) {
        nextTrack = state.queue[state.currentIndex + 1];
      } else if (repeatMode === 'all') {
        nextTrack = state.queue[0];
      }
      
      // Attempt synchronous background play transition for mobile
      if (nextTrack) {
        const nextUrl = getApiUrl('stream', { id: nextTrack.id });
        if (repeatMode === 'one') {
          audioObj.currentTime = 0;
        } else {
          audioObj.src = nextUrl;
        }
        audioObj.play().catch(e => console.error("Background play failed:", e));
      }

      playNext();
    };

    const handleError = (e) => {
      console.error("Audio playback error:", e);
      // Auto-skip on broken stream if not paused? Optional.
    };

    audioObj.addEventListener('timeupdate', handleTimeUpdate);
    audioObj.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioObj.addEventListener('ended', handleEnded);
    audioObj.addEventListener('error', handleError);

    return () => {
      audioObj.removeEventListener('timeupdate', handleTimeUpdate);
      audioObj.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioObj.removeEventListener('ended', handleEnded);
      audioObj.removeEventListener('error', handleError);
    };
  }, [setProgress, setDuration, playNext]);

  // Handle Media Session metadata
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentTrack) {
        try {
          const artworkUrl = getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 512);
          const artworkArray = artworkUrl ? [
            { src: artworkUrl, sizes: '512x512' },
            { src: artworkUrl, sizes: '256x256' },
            { src: artworkUrl, sizes: '128x128' }
          ] : [];
          
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title || 'Unknown Title',
            artist: currentTrack.artist || 'Unknown Artist',
            album: currentTrack.album || '',
            artwork: artworkArray
          });

          document.title = `${currentTrack.title} - ${currentTrack.artist}`;

          navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().togglePlay());
          navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().togglePlay());
          navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().playPrev());
          navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().playNext());
          
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            const newTime = details.seekTime;
            audioObj.currentTime = newTime;
            usePlayerStore.getState().setProgress(newTime);
          });

          navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            const skipTime = details.seekOffset || 10;
            const newTime = Math.max(audioObj.currentTime - skipTime, 0);
            audioObj.currentTime = newTime;
            usePlayerStore.getState().setProgress(newTime);
          });

          navigator.mediaSession.setActionHandler('seekforward', (details) => {
            const skipTime = details.seekOffset || 10;
            const newTime = Math.min(audioObj.currentTime + skipTime, audioObj.duration || 0);
            audioObj.currentTime = newTime;
            usePlayerStore.getState().setProgress(newTime);
          });
        } catch (e) {
          console.error("Failed to set mediaSession metadata", e);
        }
      } else {
        navigator.mediaSession.metadata = null;
        document.title = 'Pulsar';
      }
    } else {
      if (currentTrack) {
        document.title = `${currentTrack.title} - ${currentTrack.artist}`;
      } else {
        document.title = 'Pulsar';
      }
    }
  }, [currentTrack]);

  // Render nothing, Audio is managed completely in JS
  return null;
}
