import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import {WatchedMovie } from '@/types';

export const WatchCard: React.FC<WatchedMovie> = ({ movie, language }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {movie && movie.map((watchedMovie) => {
                const movieData = watchedMovie.movie;

                if (!movieData || !movieData.poster_path || !movieData.release_date) {
                    return null;
                }

                const releaseDate = new Date(movieData.release_date);
                const today = new Date();
                const isReleased = releaseDate <= today;
                const hasRating = movieData.vote_average > 0;
                const watchedPercentage = Math.min(100, (Number.parseFloat(watchedMovie.watchedTimecode) / (watchedMovie.originalTimecode * 60)) * 100);

                if (watchedPercentage >= 90 || watchedMovie.watchedTimecode === '0')
                    return ;
                {language === 'en' ? (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Continue watching</h1>
                  ) : language === 'fr' && (
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Continuer la lecture</h1>
                  )}

                return isReleased && hasRating && (
                    <div key={watchedMovie.id} className="group cursor-pointer">
                        <Link key={watchedMovie.id} href={`/movie/${watchedMovie.movieId}?language=${language}`} onClick={(e) => {
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
                                    src={`https://image.tmdb.org/t/p/original${movieData.poster_path}` || "/placeholder.svg"}
                                    alt={movieData.title}
                                    fill
                                    loading='lazy'
                                    className="object-cover transition-transform duration-300 group-hover:scale-105 group-hover:opacity-75"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="w-full gap-1 bg-white/20 backdrop-blur-sm text-white border-none hover:bg-white/30"
                                        onClick={() => window.location.href = `/movie/${watchedMovie.movieId}/watch/`}
                                    >
                                        <Play className="h-4 w-4" />
                                        Continue
                                    </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{
                                            width: `${Math.min(100, (Number.parseFloat(watchedMovie.watchedTimecode) / (watchedMovie.originalTimecode * 60)) * 100)}%`
                                        }}
                                    />
                                </div>
                            </div>
                            <h3 className="font-medium text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                                {movieData.title}
                            </h3>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-zinc-400">{movieData.release_date.substring(0, 4) || 'N/A'}</span>
                                <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
                                    <span className="text-xs text-zinc-400">{Math.round(movieData.vote_average) || '0'}/10</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
};
