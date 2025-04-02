"use client";
import { Input } from '@/app/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import { Loader } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Movie } from '@/types';


export function SearchBar() {
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState<string>('');
    const observerRef = useRef(null);


    const fetchMovie = async (searchTerm: string) => {
        if (!searchTerm) {
            setMovies([]);
            setLoading(false);
            setError(null);
            return;
        }

        try {
            setLoading(true);

            const encodedSearchTerm = encodeURIComponent(searchTerm);
            const response = await fetch(`/api/movies/search/${encodedSearchTerm}?language=fr`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setError(null);
            setMovies(data);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
        }
    };


    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const searchParam = urlParams.get('search');
        if (searchParam) {
            setSearch(searchParam);
            fetchMovie(searchParam);
        }
    }, []);

    return (
        <div className="container mx-auto p-4">
            <form onSubmit={(e) => {
                e.preventDefault();
                window.history.pushState({}, '', `?search=${encodeURIComponent(search)}`);
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
            {loading && !error && <div className="flex justify-center items-center mt-4" >
                <Loader className="animate-spin h-8 w-8" />
            </div>}
            {error && <p className="mt-2 text-center text-red-500">{error}</p>}
            {movies.length > 0 && (
                <>
                    <div className="flex items-center mb-3">
                        <Badge className="text-black bg-white mt-3">
                            <span className="text-small text-muted-foreground ml-2 ">{movies.length} {movies.length === 1 ? 'result' : 'results'}</span>
                        </Badge>
                    </div>
                    <MovieCard movies={movies} observerRef={observerRef} loadState={false} />
                    <hr className="my-4 border-gray-800 " />
                </>
            )
            }
        </div >
    )
}