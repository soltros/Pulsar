import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { getApiUrl } from '../lib/api';

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
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

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
