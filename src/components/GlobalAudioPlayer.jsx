import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { getApiUrl, getCoverArtUrl, fetchApi } from '../lib/api';

export default function GlobalAudioPlayer() {
  const audioRef = useRef(null);
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

  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef);
      audioRef.current.volume = volume;
    }
  }, [setAudioRef, volume]);

  // Handle Play/Pause changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying && currentTrack) {
      audioRef.current.play().catch(err => {
        console.error("Playback failed:", err);
        // Sometimes browsers block autoplay, handle gracefully if needed
      });
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      audioRef.current.pause();
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, currentTrack]);

  // Handle Media Session metadata and actions for MPRIS / hardware media keys
  useEffect(() => {
    if ('mediaSession' in navigator) {
      if (currentTrack) {
        try {
          const artworkUrl = currentTrack.lastFmArtUrl || getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 500);
          const artworkArray = artworkUrl ? [{ src: artworkUrl, sizes: '500x500', type: 'image/jpeg' }] : [];
          
          navigator.mediaSession.metadata = new MediaMetadata({
            title: currentTrack.title || 'Unknown Title',
            artist: currentTrack.artist || 'Unknown Artist',
            album: currentTrack.album || '',
            artwork: artworkArray
          });

          navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().togglePlay());
          navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().togglePlay());
          navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().playPrev());
          navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().playNext());
          
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (audioRef.current) {
              const newTime = details.seekTime;
              audioRef.current.currentTime = newTime;
              usePlayerStore.getState().setProgress(newTime);
            }
          });

          navigator.mediaSession.setActionHandler('seekbackward', (details) => {
            if (audioRef.current) {
              const skipTime = details.seekOffset || 10;
              const newTime = Math.max(audioRef.current.currentTime - skipTime, 0);
              audioRef.current.currentTime = newTime;
              usePlayerStore.getState().setProgress(newTime);
            }
          });

          navigator.mediaSession.setActionHandler('seekforward', (details) => {
            if (audioRef.current) {
              const skipTime = details.seekOffset || 10;
              const newTime = Math.min(audioRef.current.currentTime + skipTime, audioRef.current.duration || 0);
              audioRef.current.currentTime = newTime;
              usePlayerStore.getState().setProgress(newTime);
            }
          });
        } catch (e) {
          console.error("Failed to set mediaSession metadata", e);
        }
      } else {
        navigator.mediaSession.metadata = null;
      }
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curTime = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setProgress(curTime);

      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && dur > 0 && !isNaN(dur) && !isNaN(curTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: audioRef.current.playbackRate,
            position: curTime
          });
        } catch(e) {
          // ignore
        }
      }

      // Scrobble at 50% or 4 minutes, whichever is smaller
      if (currentTrack && dur > 0 && !scrobbledTrackIds.current.has(currentTrack.id)) {
        const scrobblePoint = Math.min(dur / 2, 240);
        if (curTime >= scrobblePoint) {
          scrobbledTrackIds.current.add(currentTrack.id);
          fetchApi('scrobble', { id: currentTrack.id, submission: true }).catch(console.error);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (currentTrack && !scrobbledTrackIds.current.has(currentTrack.id)) {
      scrobbledTrackIds.current.add(currentTrack.id);
      fetchApi('scrobble', { id: currentTrack.id, submission: true }).catch(console.error);
    }
    playNext();
  };

  // If there's no track, don't render an src
  const streamUrl = currentTrack ? getApiUrl('stream', { id: currentTrack.id }) : '';

  return (
    <audio
      ref={audioRef}
      src={streamUrl}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      preload="auto"
    />
  );
}
