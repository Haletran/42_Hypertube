'use client';

import { useState } from "react";
import { Star, Calendar, Clock, Download, Clapperboard, X } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface Torrent {
    id: string;
    name: string;
    seeders: number;
    leechers: number;
    size: string;
}

export function MovieDetails({ movie, trailerUrl }: { movie: any; trailerUrl: string }) {
    const [torrents, setTorrents] = useState<Torrent[]>([]);
    const [showTorrents, setShowTorrents] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    if (!movie) {
        return <div className="text-center py-8">Movie details not available</div>;
    }

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "/placeholder.svg?height=750&width=500";

    const fetchTorrents = async () => {
        setIsLoading(true);
        try {
            console.log(movie.original_title);
            
            const response = await fetch(`http://localhost:3000/api/stream/${movie.original_title}/download`);
            if (!response.ok) {
                throw new Error(`Failed to fetch torrents: ${response.status}`);
            }
            const data = await response.json();
            
            if (Array.isArray(data) && data.length > 0 && data[0].id !== "0") {
                setTorrents(data.slice(0, 10).map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    seeders: parseInt(item.seeders),
                    leechers: parseInt(item.leechers),
                    size: formatBytes(parseInt(item.size))
                })));
            } else {
                setTorrents([]);
            }
        } catch (error) {
            console.error("Error fetching torrents:", error);
            setTorrents([]);
        } finally {
            setIsLoading(false);
            setShowTorrents(true);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 relative">
            <div className="md:w-1/3 lg:w-1/4">
                <img
                    src={posterUrl || "/placeholder.svg"}
                    alt={movie.title || "Movie poster"}
                    className="w-full rounded-lg shadow-md object-cover"
                />
            </div>
            <div className="md:w-2/3 lg:w-3/4 space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold">{movie.title || "Unknown title"}</h1>
                {movie.production_companies?.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Produced by:</span>
                        {movie.production_companies[0].name}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {movie.genres?.map((genre: any) => (
                        <Badge key={genre.id} variant="secondary" className="text-black bg-white">
                            {genre.name}
                        </Badge>
                    ))}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {movie.vote_average !== undefined && (
                        <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{movie.vote_average.toFixed(1)}/10</span>
                        </div>
                    )}

                    {movie.runtime && (
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{movie.runtime} min</span>
                        </div>
                    )}
                    {movie.release_date && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(movie.release_date).getFullYear()}</span>
                        </div>
                    )}
                </div>

                {movie.overview && <p className="text-base text-muted-foreground">{movie.overview}</p>}
                {!movie.overview && <p className="text-base text-muted-foreground">No description available...</p>}
                <div className="flex gap-2 mt-7">
                    <Button
                        size="sm"
                        variant="secondary"
                        className="flex-grow gap-1 bg-white/50 backdrop-blur-sm text-black dark:text-white border-none hover:bg-white/30 cursor-pointer"
                        onClick={fetchTorrents}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                    {trailerUrl && (
                        <Link href={`https://www.youtube.com/embed/${trailerUrl}`} target="_blank" className="w-1/3">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="w-full gap-1 bg-white/10 backdrop-blur-sm text-black dark:text-white border-none hover:bg-white/30 cursor-pointer"
                            >
                                <Clapperboard className="h-4 w-4 mr-2" />
                                Watch Trailer
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Torrents Modal */}
            {showTorrents && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">Available Downloads for {movie.title}</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowTorrents(false)} className="rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-4">
                            {isLoading ? (
                                <div className="text-center py-8">Loading torrents...</div>
                            ) : torrents.length > 0 ? (
                                <div className="space-y-2">
                                    {torrents.map((torrent) => (
                                        <Link 
                                            href={`/movie/${movie.id}/watch?torrentId=${torrent.id}`} 
                                            key={torrent.id}
                                            className="flex justify-between items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                        >
                                            <div className="flex-1 truncate">
                                                <p className="font-medium truncate">{torrent.name}</p>
                                                <p className="text-xs text-muted-foreground">Size: {torrent.size}</p>
                                            </div>
                                            <div className="flex gap-4 items-center text-sm">
                                                <span className="text-green-500">S: {torrent.seeders}</span>
                                                <span className="text-red-500">L: {torrent.leechers}</span>
                                                <Button size="sm" variant="secondary">Select</Button>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">No torrents found for this movie</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}