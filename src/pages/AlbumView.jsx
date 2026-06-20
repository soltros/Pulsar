import { useParams } from 'react-router-dom';

export default function AlbumView() {
  const { id } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Album {id}</h1>
      <p className="text-white/50">Album tracklist and details will be displayed here.</p>
    </div>
  );
}
