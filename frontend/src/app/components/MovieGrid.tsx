import { useEffect, useState, useRef, useCallback, use } from 'react';
import { Loader } from 'lucide-react';
import { MovieCard } from './MovieCard';
import { useAuth } from '@/contexts/AuthContext';
import { Movie, MovieGridProps } from '@/types';
import { useMovieContext } from '@/contexts/MovieContext';
import Cookies from "js-cookie"
import { WatchCard } from './WatchCard';
import { Slider } from '@/app/components/ui/slider';

export function MovieGrid({ language, onMovieSelect }: MovieGridProps) {
  const { user } = useAuth();
  const { fetchUserMovies, watchedMovies, setWatchedMovies } = useMovieContext();
  const { error, setError, loading, setLoading } = useAuth();
  const [discover, setDiscover] = useState<Movie[]>([]);
  const [pagenumber, setpagenumber] = useState<number>(1);
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const observerRef = useRef(null);

  const fetchDiscover = async () => {
    try {
      setLoading(true);
      const filterQuery = filter ? `&filter=${encodeURIComponent(filter)}` : '';
      console.log('Fetching movies with filter:', filter);
      const response = await fetch(`/api/movies/popular?page=${pagenumber}&language=${language}${filterQuery}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Received movies data:', data, filterQuery, pagenumber);

      if (data.results.length === 0) {
        console.log('No more movies to load');
        return;
      }
      if (pagenumber === 1) {
        setDiscover(data.results);
      }
      else { 
        setDiscover((prev) => {
          const existingMovieIds = new Set(prev.map((movie) => movie.id));
          const newMovies = data.results.filter((movie: Movie) => !existingMovieIds.has(movie.id));
          return [...prev, ...newMovies];
        });
      }
      setpagenumber((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }

  const handleYearChange = (value: number[]) => {
    console.log('Year changed:', value);
    const year = value[0];
    setSelectedYear(year);
    setFilter(`&primary_release_year=${year}`);
    setDiscover([]);
    setpagenumber(1);
    console.log('Fetching movies with new year filter:', `&year=${year}`);
  }

  useEffect(() => {
      fetchDiscover();
  }, [filter]);

  useEffect(() => {
    const test = async () => {
      const check = await fetchUserMovies(user?.user?.id);
      setWatchedMovies(check);
    }
    const debounceTimeout = setTimeout(() => {
      fetchDiscover();
      if (firstLoad) {
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
            <div className="flex justify-between items-center mb-4">
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {language === 'en' ? 'Year' : language === 'fr' && 'Année'}: {selectedYear}
        </p>
        <Slider
          className="w-1/2"
          defaultValue={[2025]}
          value={[selectedYear]}
          min={1920}
          max={2025}
          step={1}
          onValueChange={(value) => setSelectedYear(value[0])}
          onValueCommit={(value) => handleYearChange(value)}
        />
      </div>
      {discover.length === 0 && !error && (
        <div className="flex justify-center items-center mt-4" >
          <Loader className="animate-spin h-8 w-8" />
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {watchedMovies.length > 0 && (
        <>
          <WatchCard movie={watchedMovies} language={language}/>
          <br></br>
        </>
        )}
      {discover.length > 0 && (
        <>
          {language === 'en' ? (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Discover Movies</h1>
          ) : language === 'fr' && (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Découvrir des films</h1>
          )}
          <MovieCard movies={discover} observerRef={observerRef} loadState={loading} language={language} />
        </>
      )
      }
    </div >
  );
}