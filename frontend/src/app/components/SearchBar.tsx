"use client";
import { Input } from '@/app/components/ui/input';
import { Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import { Loader } from 'lucide-react';
import { Badge } from '@/app/components/ui/badge';
import { Movie } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"

export function SearchBar() {
    const { user, loading, setLoading } = useAuth();
    const [movies, setMovies] = useState<Movie[]>([]);
    const [search, setSearch] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const language = user?.user?.language || 'en';
    const [selectedSource, setSelectedSource] = useState<string>('tmdb');
    const observerRef = useRef(null);
    
    useEffect(() => {
        if (search && selectedSource) {
            setMovies([]);
            fetchMovie(search);
        }
    }, [selectedSource]);

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
            const response = await fetch(`/api/movies/search/${encodedSearchTerm}?language=${language}&source=${selectedSource}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${Cookies.get("token")}`,
                },
            });
            if (!response.ok) {
                throw new Error(`No movies found on ${selectedSource}...`);
            }

            const data = await response.json();
            console.log('Fetched movies:', data);
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
            <div className="flex flex-col md:flex-row gap-4 mb-4 items-start">
                <form onSubmit={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, '', `?search=${encodeURIComponent(search)}`);
                    fetchMovie(search);
                }} className="relative flex-grow w-full md:w-[85%]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder={language === 'en' ? 'Search for movies...' : 'Rechercher des films...'}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 w-full"
                    />
                </form>
                <Select onValueChange={setSelectedSource} defaultValue={selectedSource}>
                    <SelectTrigger className="focus:ring-0 focus:outline-none bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 w-full md:w-[15%]">
                        <SelectValue placeholder={"Source"} />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border border-zinc-800 text-white">
                        <SelectItem
                            value="tmdb"
                            className={`flex items-center gap-2 ${selectedSource === "tmdb" ? "bg-zinc-700" : ""}`}
                        >
                            TMDB
                        </SelectItem>
                        <SelectItem
                            value="omdb"
                            className={`flex items-center gap-2 ${selectedSource === "omdb" ? "bg-zinc-700" : ""}`}
                        >
                            OMDB
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {loading && !error && <div className="flex justify-center items-center mt-4" >
                <Loader className="animate-spin h-8 w-8" />
            </div>}

            {error && <p className="mt-2 text-center text-red-500">{error}</p>}

            {movies.length > 0 && (
                <>
                    <div className="flex items-center mb-3">
                        <Badge className="text-black bg-white mt-3">
                            {movies.length} {movies.length === 1 ? (language === 'en' ? 'result' : 'résultat') : (language === 'en' ? 'results' : 'résultats')}
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