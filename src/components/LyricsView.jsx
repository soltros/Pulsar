import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

function parseSyncedLyrics(lrc) {
  const lines = lrc.split('\n');
  const parsed = [];
  const regex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;
  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        parsed.push({ time: minutes * 60 + seconds, text });
      }
    }
  }
  return parsed;
}

export default function LyricsView({ track, progress }) {
  const [lyrics, setLyrics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!track) return;
    
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setLyrics(null);

    const url = new URL('https://lrclib.net/api/get');
    url.searchParams.append('track_name', track.title || '');
    url.searchParams.append('artist_name', track.artist || '');
    if (track.album) url.searchParams.append('album_name', track.album);
    if (track.duration) url.searchParams.append('duration', track.duration);

    fetch(url)
      .then(res => {
        if (res.status === 404) throw new Error('Lyrics not found');
        if (!res.ok) throw new Error('Failed to fetch lyrics');
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        if (data.syncedLyrics) {
          setLyrics({ type: 'synced', lines: parseSyncedLyrics(data.syncedLyrics) });
        } else if (data.plainLyrics) {
          setLyrics({ type: 'plain', text: data.plainLyrics });
        } else {
          throw new Error('Lyrics not found');
        }
        setIsLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        setError(err.message);
        setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [track]);

  // Auto-scroll logic for synced lyrics
  useEffect(() => {
    if (!lyrics || lyrics.type !== 'synced' || !scrollRef.current) return;
    
    // Find active line index
    const activeIndex = lyrics.lines.findIndex((line, i) => {
      const nextLine = lyrics.lines[i + 1];
      return progress >= line.time && (!nextLine || progress < nextLine.time);
    });

    if (activeIndex !== -1) {
      const lineElement = scrollRef.current.children[activeIndex];
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [progress, lyrics]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">Fetching lyrics from lrclib...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-white/50">
        <p className="text-xl font-medium">{error}</p>
      </div>
    );
  }

  if (!lyrics) return null;

  if (lyrics.type === 'plain') {
    return (
      <div className="w-full h-full overflow-y-auto hide-scrollbar text-center md:text-left pr-4">
        <div className="whitespace-pre-wrap text-xl leading-loose font-medium text-white/80">
          {lyrics.text}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full overflow-y-auto hide-scrollbar mask-image-fade" 
      ref={scrollRef}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
      }}
    >
      <div className="py-[50%]">
        {lyrics.lines.map((line, i) => {
          const nextLine = lyrics.lines[i + 1];
          const isActive = progress >= line.time && (!nextLine || progress < nextLine.time);
          const isPast = progress > line.time && !isActive;

          return (
            <div 
              key={i} 
              className={`text-2xl md:text-3xl lg:text-4xl font-bold transition-all duration-500 mb-6 md:mb-8 text-center md:text-left ${isActive ? 'text-white scale-105 origin-left shadow-primary blur-none' : isPast ? 'text-white/40 blur-[0.5px]' : 'text-white/20 blur-[1px]'}`}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
