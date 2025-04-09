import { useEffect, useState, useRef } from 'react';
import { Loader } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { useAuth } from '@/contexts/AuthContext';
import redis from '@/lib/redis';
import { Movie, MovieGridProps } from '@/types';
import { useMovieContext } from '@/contexts/MovieContext';
import { WatchCard } from './WatchCard';

export function MovieGrid({ language, onMovieSelect }: MovieGridProps) {
  const { user } = useAuth();
  const { fetchUserMovies, watchedMovies, setWatchedMovies } = useMovieContext();
  const { error, setError, loading, setLoading } = useAuth();
  const [discover, setDiscover] = useState<Movie[]>([]);
  const [pagenumber, setpagenumber] = useState<number>(1);
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const observerRef = useRef(null);


  const fetchDiscover = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/movies/popular?page=${pagenumber}&language=${language}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

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

    const test = async () => {
      const check = await fetchUserMovies(user?.user?.id);
      console.log('check', check);
      setWatchedMovies(check);
    }
    const debounceTimeout = setTimeout(() => {
      fetchDiscover();
      if (firstLoad) {
        // here to fetch more movies on first load to fill the screen

        setFirstLoad(false);
        fetchDiscover();

      }
    }, 500);
    test();
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
      {discover.length === 0 && !error && (
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
      {watchedMovies.length > 0 && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Currently watching</h1>
          <WatchCard movie={watchedMovies} language={language}/>
          <br></br>
        </>
        )}
      {discover.length > 0 && (
        <>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Popular Movies</h1>
          <MovieCard movies={discover} observerRef={observerRef} loadState={loading} language={language} />
        </>
      )
      }
    </div >
  );
}