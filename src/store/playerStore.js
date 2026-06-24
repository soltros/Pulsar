import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const usePlayerStore = create(
  persist(
    (set, get) => ({
  queue: [],
  originalQueue: [], // to restore order when shuffle is toggled off
  currentIndex: -1,
  isPlaying: false,
  volume: 1,
  progress: 0,
  duration: 0,
  audioRef: null,
  isNowPlayingOpen: false,
  nowPlayingTab: 'art',
  isShuffle: false,
  repeatMode: 'none', // 'none', 'all', 'one'

  setAudioRef: (ref) => set({ audioRef: ref }),
  setIsNowPlayingOpen: (open) => set({ isNowPlayingOpen: open }),
  setNowPlayingTab: (tab) => set({ nowPlayingTab: tab }),

  playTrack: (track, newQueue = null, index = 0) => {
    const queue = newQueue || [track];
    const { isShuffle } = get();
    
    let activeQueue = [...queue];
    let activeIndex = index;
    
    if (isShuffle) {
      // Keep current track at index 0, shuffle the rest
      const remaining = activeQueue.filter((_, i) => i !== index);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      activeQueue = [activeQueue[index], ...remaining];
      activeIndex = 0;
    }
    
    set({ queue: activeQueue, originalQueue: queue, currentIndex: activeIndex, isPlaying: true, progress: 0 });
  },

  setQueue: (queue) => set({ queue, originalQueue: queue }),

  updateTrackInQueue: (trackId, updates) => set(state => ({
    queue: state.queue.map(t => t.id === trackId ? { ...t, ...updates } : t),
    originalQueue: state.originalQueue.map(t => t.id === trackId ? { ...t, ...updates } : t)
  })),

  addToQueueNext: (tracks) => {
    const { queue, originalQueue, currentIndex } = get();
    const newQueue = [...queue];
    const newOrigQueue = [...originalQueue];
    const insertIdx = currentIndex >= 0 ? currentIndex + 1 : 0;
    newQueue.splice(insertIdx, 0, ...tracks);
    newOrigQueue.splice(insertIdx, 0, ...tracks);
    set({ queue: newQueue, originalQueue: newOrigQueue });
    if (currentIndex === -1) {
      set({ currentIndex: 0, isPlaying: true });
    }
  },

  addToQueueLast: (tracks) => {
    const { queue, originalQueue, currentIndex } = get();
    set({ queue: [...queue, ...tracks], originalQueue: [...originalQueue, ...tracks] });
    if (currentIndex === -1) {
      set({ currentIndex: 0, isPlaying: true });
    }
  },

  playNext: () => {
    const { queue, currentIndex, repeatMode } = get();
    if (repeatMode === 'one') {
      const { audioRef } = get();
      if (audioRef?.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
      set({ progress: 0 });
      return;
    }

    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, isPlaying: true, progress: 0 });
    } else {
      if (repeatMode === 'all') {
        set({ currentIndex: 0, isPlaying: true, progress: 0 });
      } else {
        set({ isPlaying: false });
      }
    }
  },

  playPrev: () => {
    const { currentIndex, progress, queue, repeatMode } = get();
    if (progress > 3) {
      set({ progress: 0 });
      const { audioRef } = get();
      if (audioRef?.current) audioRef.current.currentTime = 0;
    } else if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, isPlaying: true, progress: 0 });
    } else if (repeatMode === 'all') {
      set({ currentIndex: queue.length - 1, isPlaying: true, progress: 0 });
    }
  },

  togglePlay: () => {
    const { isPlaying, audioRef, queue, currentIndex } = get();
    if (queue.length === 0 || currentIndex === -1) return;
    
    if (isPlaying) {
      audioRef?.current?.pause();
      set({ isPlaying: false });
    } else {
      audioRef?.current?.play().catch(console.error);
      set({ isPlaying: true });
    }
  },

  setVolume: (volume) => {
    const { audioRef } = get();
    if (audioRef?.current) {
      audioRef.current.volume = volume;
    }
    set({ volume });
  },

  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),
  
  seek: (time) => {
    const { audioRef } = get();
    if (audioRef?.current) {
      audioRef.current.currentTime = time;
      set({ progress: time });
    }
  },

  toggleShuffle: () => {
    const { isShuffle, queue, originalQueue, currentIndex } = get();
    if (isShuffle) {
      // Turn off shuffle
      const currentTrack = queue[currentIndex];
      const origIndex = originalQueue.findIndex(t => t.id === currentTrack?.id) || 0;
      set({ isShuffle: false, queue: [...originalQueue], currentIndex: origIndex });
    } else {
      // Turn on shuffle
      const currentTrack = queue[currentIndex];
      const remaining = queue.filter((_, i) => i !== currentIndex);
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
      }
      set({ isShuffle: true, queue: [currentTrack, ...remaining], currentIndex: 0 });
    }
  },

  toggleRepeat: () => {
    const { repeatMode } = get();
    const nextMode = repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none';
    set({ repeatMode: nextMode });
  }
}), {
  name: 'pulsar-player-state',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    queue: state.queue,
    originalQueue: state.originalQueue,
    currentIndex: state.currentIndex,
    volume: state.volume,
    isShuffle: state.isShuffle,
    repeatMode: state.repeatMode
  }),
}));
