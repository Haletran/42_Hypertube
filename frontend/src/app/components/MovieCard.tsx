import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Movie, MovieCardProps } from '@/types';
import Cookies from "js-cookie"
import { useMovieContext  } from '@/contexts/MovieContext';

export const MovieCard: React.FC<MovieCardProps> = ({ movies, observerRef, loadState, language }) => {
    const [availableMovies, setAvailableMovies] = useState<{[key: number]: boolean}>({});
    const [watchedMovies, setWatchedMovies] = useState<{[key: number]: boolean}>({});
    const { fetchUserMovies } = useMovieContext();

    const isAvailable = async (id: number): Promise<boolean> => {
        try {
            const response = await fetch(`http://localhost:3333/api/stream/${id}/video/isAvailable`, {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Cookies.get("token")}`,
                },
              });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    const convertTimecode = (timecode: string) => {
        const seconds = Number.parseFloat(timecode)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = Math.floor(seconds % 60)
        return `${minutes}`
      }

    const isWatched = async (id: number): Promise<boolean> => {
        try {
            const response = await fetchUserMovies(id);
            if (response && Array.isArray(response)) {
                const watchedMovie = response.find((movie) => movie.movieId === id);
                if (watchedMovie) {
                    const currentTime = convertTimecode(watchedMovie.watchedTimecode);
                    const totalTime = watchedMovie.originalTimecode;
                    if (currentTime && totalTime) {
                        return parseInt(currentTime) * 1.1 >= parseInt(totalTime) ? true : false;
                    }
                }
            }
        }
        catch (error) {
            return false;
        }
    }


    useEffect(() => {
        const checkAvailability = async () => {
            const availabilityMap: {[key: number]: boolean} = {};
            
            await Promise.all(
                movies.map(async (movie) => {
                    try {
                        availabilityMap[movie.id] = await isAvailable(movie.id);
                        watchedMovies[movie.id] = await isWatched(movie.id);
                    } catch {
                        availabilityMap[movie.id] = false;
                        watchedMovies[movie.id] = false;
                    }
                })
            );
            
            setAvailableMovies(availabilityMap);
        };

        checkAvailability();
    }, [movies]);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movies.length > 0 && movies.map((movie) => {
                const releaseDate = new Date(movie.release_date);
                const today = new Date();
                const isReleased = releaseDate <= today;
                const hasRating = movie.vote_average > 0;

                return movie.poster_path && movie.release_date && isReleased && hasRating && (
                    <div key={movie.id} className="group cursor-pointer" >
                        <Link prefetch={true} key={movie.id} href={`/movie/${movie.id}?language=${language}`} onClick={(e) => {
                            const target = e.currentTarget.parentElement;
                            if (target) {
                                const overlay = document.createElement('div');
                                overlay.className = "absolute inset-0 flex items-center justify-center bg-black/60 rounded-md";
                                overlay.innerHTML = '<div class="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>';
                                
                                const imgContainer = target.querySelector('.relative');
                                if (imgContainer) {
                                    imgContainer.appendChild(overlay);
                                }
                            }
                        }}>
                            <div className="relative aspect-[2/3] overflow-hidden rounded-md mb-2 bg-zinc-800">
                                <Image
                                    src={`https://image.tmdb.org/t/p/original${movie.poster_path}` || "/placeholder.svg"}
                                    alt={movie.title}
                                    fill
                                    loading='lazy'
                                    className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-75"
                                />
                                {watchedMovies[movie.id] && (
                                    <div className="absolute top-2 right-2 bg-green-600/80 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span>Watched</span>
                                    </div>
                                )}
                                {availableMovies[movie.id] && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                    <div className="w-full" onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.location.href = `/movie/${movie.id}/watch?language=${language}`;
                                    }}>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full gap-1 bg-white/20 backdrop-blur-sm text-white border-none hover:bg-white/30"
                                        >
                                            <Play className="h-4 w-4" />
                                            Play
                                        </Button>
                                    </div>
                                </div>
                                )}
                            </div>
                            <h3 className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                {movie.title}
                            </h3>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-zinc-400">{parseInt(movie.release_date) || 'N/A'}</span>
                                <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                    <span className="text-xs text-zinc-400">{Math.round(movie.vote_average) || '0'}/10</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
            {loadState && (
                <div className="flex justify-center items-center w-full mt-4">
                    <Loader className="animate-spin h-8 w-8" />
                </div>
            )}
            <div ref={observerRef} className="col-span-full h-1"></div>
        </div>
    );
};
