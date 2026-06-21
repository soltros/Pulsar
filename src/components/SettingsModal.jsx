import { useState } from 'react';
import { X } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useLibraryStore } from '../store/libraryStore';
import { fetchApi } from '../lib/api';

export default function SettingsModal({ isOpen, onClose }) {
  const { 
    autoFetchHomeArt, 
    hideDuplicateTracks,
    enableTagWriting,
    musicMountPath,
    toggleAutoFetchHomeArt,
    toggleHideDuplicateTracks,
    toggleEnableTagWriting,
    setMusicMountPath
  } = useSettingsStore();
  const scanLastFmArt = useLibraryStore(state => state.scanLastFmArt);
  const scanLastFmArtists = useLibraryStore(state => state.scanLastFmArtists);
  const scanLastFmTracks = useLibraryStore(state => state.scanLastFmTracks);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningArtists, setIsScanningArtists] = useState(false);
  const [isScanningTracks, setIsScanningTracks] = useState(false);

  if (!isOpen) return null;

  const handleClearServerCache = async () => {
    if (confirm('Are you sure you want to clear the server metadata cache for all users?')) {
      try {
        await fetch('/api/metadata/refresh', { method: 'POST' });
        alert('Server cache cleared. Metadata will be re-fetched from Last.fm upon next scan.');
      } catch (e) {
        alert('Failed to clear server cache.');
      }
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    await scanLastFmArt();
    setIsScanning(false);
  };

  const handleScanArtists = async () => {
    setIsScanningArtists(true);
    await scanLastFmArtists();
    setIsScanningArtists(false);
  };

  const handleScanTracks = async () => {
    setIsScanningTracks(true);
    await scanLastFmTracks();
    setIsScanningTracks(false);
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
        alert('Offline audio and image caches successfully cleared!');
      } else {
        alert('Offline caching is not supported in this browser.');
      }
    } catch (e) {
      console.error('Failed to clear cache:', e);
      alert('Failed to clear caches.');
    }
  };

  const handleExportHearts = async () => {
    try {
      const res = await fetchApi('getStarred2');
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.starred2, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "pulsar_favorites_export.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      alert("Failed to export favorites.");
    }
  };

  const handleImportHearts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async e => {
      try {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = async event => {
          const data = JSON.parse(event.target.result);
          if (data.song) {
            for (let song of data.song) {
              await fetchApi('star', { id: song.id }).catch(() => {});
            }
          }
          if (data.album) {
            for (let album of data.album) {
              await fetchApi('star', { albumId: album.id }).catch(() => {});
            }
          }
          if (data.artist) {
            for (let artist of data.artist) {
              await fetchApi('star', { artistId: artist.id }).catch(() => {});
            }
          }
          alert("Import successful! Resyncing library...");
          useLibraryStore.getState().syncLibrary();
        };
        reader.readAsText(file);
      } catch (err) {
        alert("Failed to import. Make sure the file is a valid Pulsar export JSON.");
      }
    }
    input.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#16171d] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
        
        <div className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white">Server Metadata Integration</h4>
            <p className="text-xs text-white/50 mb-4">
              Pulsar now fetches enhanced metadata from its own backend server. The Last.fm API key is managed via Docker.
            </p>
            <button 
              onClick={handleClearServerCache}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors border border-white/10"
            >
              Clear Server Metadata Cache
            </button>
          </div>
          
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4 mt-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Auto-fetch Home Cover Art</h4>
              <p className="text-xs text-white/50 mt-1 mr-2">Automatically load images on the home screen. Turn off to prevent 429 errors.</p>
            </div>
            <button 
              onClick={toggleAutoFetchHomeArt}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${autoFetchHomeArt ? 'bg-primary' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute ${autoFetchHomeArt ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <h4 className="text-sm font-semibold text-white">Hide Duplicate Tracks</h4>
              <p className="text-xs text-white/50 mt-1 mr-2">Automatically hide duplicate track titles within albums.</p>
            </div>
            <button 
              onClick={toggleHideDuplicateTracks}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${hideDuplicateTracks ? 'bg-primary' : 'bg-white/20'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute ${hideDuplicateTracks ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white">Save Cover Art to Album Folders (Admin)</h4>
                <p className="text-xs text-white/50 mt-1 mr-2">Download Last.fm art as cover.jpg/folder.jpg sidecar files.</p>
              </div>
              <button 
                onClick={toggleEnableTagWriting}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${enableTagWriting ? 'bg-primary' : 'bg-white/20'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute ${enableTagWriting ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {enableTagWriting && (
              <div>
                <label className="text-xs text-white/70 font-medium mb-1 block">Docker Volume Mount Path</label>
                <input 
                  type="text" 
                  value={musicMountPath}
                  onChange={(e) => setMusicMountPath(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary transition-colors"
                  placeholder="/app/media/music"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 mt-6">
            <h4 className="text-sm font-semibold text-white">Library Tools</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleScan} disabled={isScanning} className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-medium py-2 rounded-xl transition-colors border border-white/10 text-xs flex items-center justify-center gap-2">
                {isScanning ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Scan Albums
              </button>
              <button onClick={handleScanArtists} disabled={isScanningArtists} className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-medium py-2 rounded-xl transition-colors border border-white/10 text-xs flex items-center justify-center gap-2">
                {isScanningArtists ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Scan Artists
              </button>
            </div>
            <button onClick={handleScanTracks} disabled={isScanningTracks} className="w-full bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-medium py-2 rounded-xl transition-colors border border-white/10 text-xs flex items-center justify-center gap-2">
              {isScanningTracks ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              Scan Popular Tracks
            </button>

            <button onClick={handleClearCache} className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-medium py-2 rounded-xl transition-colors border border-orange-500/20 text-sm">
              Clear Offline Cache
            </button>
            
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
              <button onClick={handleExportHearts} className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-2 rounded-xl transition-colors border border-primary/20 text-xs">
                Export Hearts
              </button>
              <button onClick={handleImportHearts} className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-2 rounded-xl transition-colors border border-white/10 text-xs">
                Import Hearts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
