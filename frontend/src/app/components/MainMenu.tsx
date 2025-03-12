import { useEffect, useState, useRef } from 'react';
import { Input } from './ui/input';
import { Search, Loader } from 'lucide-react';
import { MovieCard } from './MovieCard';

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
  const [pagenumber, setpagenumber] = useState<number>(1);
  const observerRef = useRef(null);

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
      const response = await fetch(`http://localhost:3333/api/movies/popular?page=${pagenumber}?language=fr`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.results);

      // this is dumb but fix duplication issue that shouldn't happen in the first place
      setDiscover((prev) => {
        const existingMovieIds = new Set(prev.map((movie) => movie.id));
        const newMovies = data.results.filter((movie: Movie) => !existingMovieIds.has(movie.id));
        return [...prev, ...newMovies];
      });
      setpagenumber((prev) => prev + 1);
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


  // dont know if this is the best way to do this
  useEffect(() => {
    if (!observerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchDiscover();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [discover]);

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

      {smovies.length === 0 && discover.length === 0 && (
        <div className="flex justify-center items-center mt-4" >
          <Loader className="animate-spin h-8 w-8" />
        </div>
      )
      }

      {
        error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Error: {error}
          </div>
        )
      }

      {smovies.length > 0 && (
        <>
          <h1 className="mb-2"> Found : {smovies.length} movies</h1> &&
          <MovieCard movies={smovies} observerRef={observerRef} loadState={loading} />
        </>
      )}

      {discover.length > 0 && (
        <>
          <h1 className="mb-2 text-4xl">Popular Movies</h1>
          <MovieCard movies={discover} observerRef={observerRef} loadState={loading} />
        </>
      )}


    </div >
  );
}