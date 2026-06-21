import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { getApiUrl, getCoverArtUrl } from '../lib/api';

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

  useEffect(() => {
    if (audioRef.current) {
      setAudioRef(audioRef);
    }
  }, [setAudioRef]);

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
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentTrack.title,
          artist: currentTrack.artist,
          album: currentTrack.album || '',
          artwork: [
            { src: currentTrack.lastFmArtUrl || getCoverArtUrl(currentTrack.coverArt || currentTrack.albumId, 500), sizes: '500x500', type: 'image/jpeg' }
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => usePlayerStore.getState().togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => usePlayerStore.getState().togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => usePlayerStore.getState().playPrev());
        navigator.mediaSession.setActionHandler('nexttrack', () => usePlayerStore.getState().playNext());
      } else {
        navigator.mediaSession.metadata = null;
      }
    }
  }, [currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
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
