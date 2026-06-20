import { useParams } from 'react-router-dom';

export default function PlaylistView() {
  const { id } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Playlist {id}</h1>
      <p className="text-white/50">Playlist tracklist and details will be displayed here.</p>
    </div>
  );
}
