import { use, useEffect, useState } from 'react';
import { Input } from './ui/input';
import { Search } from 'lucide-react';
import Image from "next/image"
import { Star, Play } from "lucide-react"
import { Button } from '@/app/components/ui/button'

interface Movie {
  id: number;
  title: string;
  tagline: string;
  overview: string;
  poster_path: string;
  vote_average: number;
  release_date: string
}

interface MovieSearchProps {
  onMovieSelect?: (movie: Movie) => void;
}

export function MovieSearch({ onMovieSelect }: MovieSearchProps) {
  const [smovies, setMovies] = useState<Movie[]>([]);
  const [discover, setDiscover] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const fetchMovie = async (searchTerm: string) => {
    if (!searchTerm) {
      setMovies([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3333/api/movies/${searchTerm}?language=fr`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setMovies(data);

      if (onMovieSelect) {
        onMovieSelect(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscover = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3333/api/movies/popular/');
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setDiscover(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (search.trim() === '') {
        fetchDiscover();
      } else {
        setDiscover([]);
        fetchMovie(search);
      }
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

      {smovies.length > 0 && <h1 className="mb-2"> Found : {smovies.length} movies</h1>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {smovies.length > 0 && smovies.map((movie) => (
          movie.poster_path && (
            <div key={movie.id} className="group cursor-pointer">
              <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2 bg-zinc-800">
                <Image
                  src={`https://image.tmdb.org/t/p/original${movie.poster_path}` || "/placeholder.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full gap-1 bg-white/20 backdrop-blur-sm text-white border-none hover:bg-white/30"
                    onClick={() => window.location.href = `/watch/${movie.id}`}
                  >
                    <Play className="h-4 w-4" />
                    Play
                  </Button>
                </div>
              </div>
              <h3 className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                {movie.title}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-zinc-400">{parseInt(movie.release_date)}</span>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                  <span className="text-xs text-zinc-400">{Math.round(movie.vote_average * 10)}%</span>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      {discover.length > 0 && <h1 className="mb-2 text-4xl">Popular Movies</h1>}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {discover.length > 0 && discover.map((movie) => (
          movie.poster_path && (
            <div key={movie.id} className="group cursor-pointer">
              <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2 bg-zinc-800">
                <Image
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}` || "/placeholder.svg"}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full gap-1 bg-white/20 backdrop-blur-sm text-white border-none hover:bg-white/30"
                    onClick={() => window.location.href = `/watch/${movie.id}`}
                  >
                    <Play className="h-4 w-4" />
                    Play
                  </Button>
                </div>
              </div>
              <h3 className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                {movie.title}
              </h3>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-zinc-400">{parseInt(movie.release_date)}</span>
                <div className="flex items-center">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                  <span className="text-xs text-zinc-400">{Math.round(movie.vote_average * 10)}%</span>
                </div>
              </div>
            </div>
          )
        ))}
      </div>


    </div >
  );
}