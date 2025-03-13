import { useEffect, useState, useRef } from 'react';
import { Loader } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { SearchBar } from './SearchBar';
import { Navbar } from './ui/navbar';
import { Nanum_Gothic_Coding } from 'next/font/google';

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
  const [discover, setDiscover] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagenumber, setpagenumber] = useState<number>(1);
  const observerRef = useRef(null);


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
      fetchDiscover();
    }, 500);
    return () => clearTimeout(debounceTimeout);
  }, [onMovieSelect]);


  // dont know if this is the best way to do this
  // infinite scroll
  useEffect(() => {
    if (!observerRef.current) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) {
        fetchDiscover();
        observer.unobserve(entry.target);
      }
    }, { threshold: 1.0 });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [discover]);

  return (
    <div className="container mx-auto p-4">
      {discover.length === 0 && (
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
      {discover.length > 0 && (
        <>
          <h1 className="text-2xl font-bold text-white mt-4 mb-3">Popular Movies</h1>
          <MovieCard movies={discover} observerRef={observerRef} loadState={loading} />
        </>
      )
      }
    </div >
  );
}