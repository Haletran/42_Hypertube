import { useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

interface Movie {
  title: string;
  tagline: string;
  overview: string;
  backdrop_path: string;
}

interface MovieSearchProps {
  onMovieSelect?: (movie: Movie) => void;
}

export function MovieSearch({ onMovieSelect }: MovieSearchProps) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const fetchMovie = async (searchTerm: string) => {
    if (!searchTerm) {
      setMovie(null);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3333/api/movies/${searchTerm}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setMovie(data);
      
      if (onMovieSelect) {
        onMovieSelect(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      fetchMovie(search);
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [search, onMovieSelect]);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <form onSubmit={(e) => {
          e.preventDefault();
          fetchMovie(search);
        }} className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for a movie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </form>
      </div>

      {loading && <p className="text-gray-500">Loading movie details...</p>}
      
      {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error: {error}
      </div>
      )}
      
      {movie && (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800">{movie.title}</h2>
        <img src={`https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`} alt={movie.title} className="mt-4" />
        <p className="text-gray-600 italic mt-1">{movie.tagline}</p>
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-800">Overview:</h3>
          <p className="text-gray-700">{movie.overview}</p>
        </div>
      </div>
      )}
    </div>
  );
}