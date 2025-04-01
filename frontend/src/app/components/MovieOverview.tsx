"use client";
import { use, useState, useEffect } from "react";
import { Star, Calendar, Clock, Download, Clapperboard, X, Play, Loader } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { Torrent } from '@/types';


export function MovieDetails({ movie, trailerUrl }: { movie: any; trailerUrl: string }) {
    const [torrents, setTorrents] = useState<Torrent[]>([]);
    const [showTorrents, setShowTorrents] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlayable, setIsPlayable] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [providersTorrents, setProvidersTorrents] = useState<Record<string, Torrent[]>>();
    const [selectedProvider, setSelectedProvider] = useState<'all' | '1337x' | 'piratebay' | 'yts' | 'eztv' | 'tgx' | 'torlock' | 'nyaasi' | 'rarbg' | 'kickass' | 'bitsearch' | 'glodls' | 'limetorrent' | 'torrentfunk' | 'torrentproject'>('all');
    const [isFetching, setIsFetching] = useState(false);

    if (!movie) {
        return <div className="text-center py-8">Movie details not available</div>;
    }

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "/placeholder.svg?height=750&width=500";

    const fetchTorrents = async () => {
        setIsFetching(true);
        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:3333/api/stream/${movie.original_title}/download`);
            if (!response.ok) throw new Error(`Failed to fetch torrents: ${response.status}`);
            
            const data = await response.json();
            console.log('API Response:', data);

            const transformed: Record<string, Torrent[]> = {
                all: [],
                '1337x': [],
                piratebay: [],
                yts: [],
                eztv: [],
                tgx: [],
                torlock: [],
                nyaasi: [],
                rarbg: [],
                kickass: [],
                bitsearch: [],
                glodls: [],
                limetorrent: [],
                torrentfunk: [],
                torrentproject: []
            };

            Object.entries(data).forEach(([provider, torrents]) => {
                if (Array.isArray(torrents)) {
                    const cleanTorrents = torrents
                        .filter(t => t?.Magnet)
                        .map(t => ({
                            id: movie.id,
                            name: t.Name || t.title,
                            seeders: parseInt(t.Seeders) || 0,
                            leechers: parseInt(t.Leechers) || 0,
                            size: t.Size || 'N/A',
                            info_hash: t.Magnet
                        }));

                    if (provider === '1337x' || provider === 'piratebay' || provider === 'yts' || provider === 'eztv' || provider === 'tgx' || provider === 'torlock' || provider === 'nyaasi' || provider === 'rarbg' || provider === 'kickass' || provider === 'bitsearch' || provider === 'glodls' || provider === 'limetorrent' || provider === 'torrentfunk' || provider === 'torrentproject') {
                        transformed[provider] = cleanTorrents;
                    }
                    transformed.all.push(...cleanTorrents);
                }
            });

            setProvidersTorrents(transformed);
            setShowTorrents(true);
        } catch (error) {
            console.error("Error fetching torrents:", error);
            setProvidersTorrents({});
        } finally {
            setIsLoading(false);
            setIsFetching(false); 
        }
    };

    const downloadTorrent = async (info_hash: string, movieId: string) => {
        try {

            // Extract just the hash part if it's a complete magnet URI
            const hashValue = info_hash.startsWith('magnet:') ? 
                info_hash.match(/urn:btih:([a-zA-Z0-9]+)/)?.[1] || info_hash :
                info_hash;
                
            const response = await fetch(`http://localhost:3333/api/stream/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    magnet: `magnet:?xt=urn:btih:${hashValue}`,
                    streamId: movieId.toString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to start stream: ${response.status}`);
            }
            
            const data = await response.json();

            await checkDownload(movieId);
            console.log(data);
            setShowTorrents(false);
        } catch (error) {
            console.error("Error starting stream:", error);
        }
    }

    const isAvailable = async (id: number): Promise<boolean> => {
        try {
            const response = await fetch(`http://localhost:3333/api/stream/${id}/video`);
            return response.ok;
        } catch (error) {
            console.error('Failed to fetch movie:', error);
            return false;
        }
    }


    const checkDownload = async (id: any): Promise<boolean> => {
        try {
            const response = await fetch(`http://localhost:3333/api/stream/${id}/status`);
            if (!response.ok) {
                throw new Error(`Failed to fetch movie status: ${response.status}`);
            }
            const data = await response.json();
            setIsDownloading(data.status === 'downloading');
            console.log("STATUS : " , data.status, "| PROGRESS : ", data.progress);
            return data.status === 'downloading';
        } catch (error) {
            console.error('Failed to fetch movie status:', error);
            setIsDownloading(false);
            return false;
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    };

    useEffect(() => {
        (async () => {
            const available = await isAvailable(movie.id);
            await checkDownload(movie.id);
            if (available) {
                setIsPlayable(true);
                console.log(`Movie with ID ${movie.id} is available for streaming.`);
            } else {
                setIsPlayable(false);
                console.log(`Movie with ID ${movie.id} is not available for streaming.`);
            }
        })();
    }, [isAvailable, isDownloading]);


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
                {isDownloading && (
                        <div>
                            <p className="text-sm text-red-500">Downloading...</p>
                        </div>
                    )}
                <div className="flex gap-2 mt-7">
                    <Button
                        className={`flex-grow gap-1 backdrop-blur-sm text-black dark:text-white border-none hover:bg-white/30 cursor-pointer ${isPlayable ? 'bg-white/50' : 'bg-white/50'}`}
                        onClick={isPlayable 
                            ? () => window.location.href = `http://localhost:3000/movie/${movie.id}/watch` 
                            : fetchTorrents}
                        disabled={isFetching}
                    >
                        {isFetching ? (
                            <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                Fetching...
                            </>
                        ) : isPlayable ? (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Play
                            </>
                        ) : (
                            <>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                            </>
                        )}
                    </Button>
                    
                    {trailerUrl && (
                        <Link href={`https://www.youtube.com/embed/${trailerUrl}`} target="_blank" className="w-1/3">
                            <Button
                                className="w-full gap-1 bg-white/10 backdrop-blur-sm text-black dark:text-white border-none hover:bg-white/30 cursor-pointer"
                            >
                                <Clapperboard className="h-4 w-4 mr-2" />
                                Watch Trailer
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {showTorrents && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-secondary rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold">Sources pour {movie.title}</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowTorrents(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        {/* Onglets des providers */}
                        <div className="px-4 py-2 border-b">
                            <div className="flex gap-2 flex-wrap">
                                {providersTorrents && Object.keys(providersTorrents).map(provider => (
                                    <Button
                                        key={provider}
                                        variant={selectedProvider === provider ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedProvider(provider as any)}
                                    >
                                        {provider.toUpperCase()}
                                    </Button>
                                ))}
                            </div>
                        </div>


                        {/* Liste des torrents */}
                        <div className="p-4">
                            {isLoading ? (
                                <div className="text-center py-8">
                                    <Loader className="h-6 w-6 animate-spin mx-auto" />
                                    <p>Chargement des sources...</p>
                                </div>
                            ) : (
                                <>
                                    {providersTorrents[selectedProvider]?.length > 0 ? (
                                        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                            {providersTorrents[selectedProvider].map((torrent, index) => (
                                                <div key={index} className="flex justify-between items-center p-3 rounded-md bg-background">
                                                    <div className="flex-1 truncate">
                                                        <p className="font-medium truncate">{torrent.name}</p>
                                                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                                            <span>{torrent.size}</span>
                                                            <span>•</span>
                                                            <span className="text-green-500">↑ {torrent.seeders}</span>
                                                            <span className="text-red-500">↓ {torrent.leechers}</span>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => downloadTorrent(torrent.info_hash, movie.id)}
                                                    >
                                                        Sélectionner
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            Aucune source trouvée {selectedProvider !== 'all' ? `sur ${selectedProvider}` : ''}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}