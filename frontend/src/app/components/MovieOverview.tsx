"use client"

import { useState, useEffect, useCallback, use } from "react"
import { Star, Calendar, Clock, Download, Clapperboard, Play, Loader, Trash } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import { TorrentModal } from "@/app/components/Torrent_modal"
import { Movie, Torrent } from '@/types';
import { useMovieContext } from "@/contexts/MovieContext";
import { useAuth } from "@/contexts/AuthContext";
import Cookies from "js-cookie"

export function MovieDetails({ movie, trailerUrl }: { movie: Movie; trailerUrl: string }) {
  const [showTorrents, setShowTorrents] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isPlayable, setIsPlayable] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [providersTorrents, setProvidersTorrents] = useState<Record<string, Torrent[]> | null>(null)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const { addMovie, deleteMovie } = useMovieContext()
  const { user } = useAuth()
  const { language } = user?.user || "en"

  const posterUrl = movie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "/placeholder.svg?height=750&width=500"


  const checkDownload = useCallback(async (id: any): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:3333/api/stream/${id}/status`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch movie status: ${response.status}`)
      }
      const data = await response.json()
      if (data.status === "complete" || data.progress === 100) {
        setIsDownloading(false)
        setIsPlayable(true)
        return false
      }

      if (data.status === "converting") {
        setIsDownloading(false)
        setIsPlayable(true)
        return true
      }

      if (data.status === "error") {
        setIsDownloading(false)
        setIsPlayable(false)
        return false
      }


      setIsDownloading(data.status)
      return data.status === "downloading"
    } catch (error) {
      console.error("Failed to fetch movie status:", error)
      setIsDownloading(false)
      return false
    }
  }, [])


  const deleteM = async (id: number) => {
    try {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 200))
      await deleteMovie(id)
      setIsLoading(false)
      setIsDownloading(false)
    } catch (error) {
      console.error("Error deleting movie:", error)
      setError("Failed to delete movie")
      setIsLoading(false)
    }
  }

  const isAvailable = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`http://localhost:3333/api/stream/${id}/video/isAvailable`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      if (response.status !== 200) {
        return false;
      }
      setIsPlayable(true)
      return response.ok
    } catch (error) {
      console.error("Failed to fetch movie:", error)
      return false
    }
  }, [])


  const pollDownloadStatus = useCallback((movieId: number) => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const response = await fetch(`http://localhost:3333/api/stream/${movieId}/status`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        if (!response.ok) throw new Error();

        const data = await response.json();

        if (data.status === "downloading") {
          setIsDownloading(true);
          const availability = await isAvailable(movieId);
          if (availability) {
            setIsPlayable(true);
            setIsDownloading(false);
            clearTimeout(intervalId);
          } else {
            setIsPlayable(false);
            intervalId = setTimeout(checkStatus, 5000);
          }
        } else if (data.status === "complete") {
          setIsPlayable(true);
          setIsDownloading(false);
        } else if (data.status === "error") {
          setIsPlayable(false);
          setIsDownloading(false);
        } else if (data.status === "converting") {
          setIsPlayable(true);
          setIsDownloading(false);
        }
      } catch {
        setIsDownloading(false);
        setIsPlayable(false);
      }
    };

    checkStatus();

    return () => clearTimeout(intervalId);
  }, []);


  const fetchTorrents = async () => {
    setIsFetching(true)
    setIsLoading(true)
    setError(undefined)

    if (localStorage.getItem(`${movie.id}`)) {
      const cachedTorrents = localStorage.getItem(`${movie.id}`)
      if (cachedTorrents) {
        const parsedTorrents = JSON.parse(cachedTorrents)
        await new Promise((resolve) => setTimeout(resolve, 200))
        setProvidersTorrents(parsedTorrents)
        setShowTorrents(true)
        setIsLoading(false)
        setIsFetching(false)
        return
      }
    }

    try {
      const releaseYear = movie.release_date.split("-")[0];
      const response = await fetch(`http://localhost:3333/api/stream/${movie.original_title}.${releaseYear}/download`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch torrents: ${response.status}`)
      }

      const data = await response.json()

      const detectQuality = (name: string): string | undefined => {
        const qualityPatterns = [
          { regex: /\b4K\b|\b2160p\b|\bUHD\b/i, quality: "4K" },
          { regex: /\b1080p\b|\bFHD\b/i, quality: "1080p" },
          { regex: /\b720p\b|\bHD\b/i, quality: "720p" },
          { regex: /\b480p\b/i, quality: "480p" },
          { regex: /\bBRRip\b|\bBluRay\b|\bBDRip\b/i, quality: "BRRip" },
          { regex: /\bWEBRip\b|\bWEB-DL\b/i, quality: "WEBRip" },
          { regex: /\bDVDRip\b/i, quality: "DVDRip" },
          { regex: /\bHDCAM\b|\bCAM\b/i, quality: "CAM" },
        ]

        for (const { regex, quality } of qualityPatterns) {
          if (regex.test(name)) {
            return quality
          }
        }

        return undefined
      }

      const detectLanguage = (name: string): string | undefined => {
        const languagePatterns = [
          { regex: /\bFRENCH\b|\bFR\b/i, language: "FR" },
          { regex: /\bENGLISH\b|\bENG\b/i, language: "EN" },
          { regex: /\bESPANOL\b|\bSPANISH\b|\bES\b/i, language: "ES" },
          { regex: /\bGERMAN\b|\bDE\b/i, language: "DE" },
          { regex: /\bITALIAN\b|\bIT\b/i, language: "IT" },
          { regex: /\bRUSSIAN\b|\bRU\b/i, language: "RU" },
          { regex: /\bJAPANESE\b|\bJP\b/i, language: "JP" },
          { regex: /\bKOREAN\b|\bKR\b/i, language: "KR" },
          { regex: /\bCHINESE\b|\bCN\b/i, language: "CN" },
        ]

        for (const { regex, language } of languagePatterns) {
          if (regex.test(name)) {
            return language
          }
        }
        return "EN"
      }

      const transformed: Record<string, Torrent[]> = {
        all: [],
        "1337x": [],
        piratebay: [],
        torlock: [],
        rarbg: [],
        bitsearch: [],
        glodls: [],
        torrentproject: [],
      }

      Object.entries(data).forEach(([provider, torrents]) => {
        if (Array.isArray(torrents)) {
          const cleanTorrents = torrents
            .filter((t) => t?.Magnet)
            .map((t) => {
              const name = t.Name || t.title
              return {
                id: movie.id,
                name,
                seeders: Number.parseInt(t.Seeders) || 0,
                leechers: Number.parseInt(t.Leechers) || 0,
                size: t.Size || "N/A",
                info_hash: t.Magnet,
                quality: detectQuality(name),
                language: detectLanguage(name),
                provider,
              }
            })

          if (Object.prototype.hasOwnProperty.call(transformed, provider)) {
            transformed[provider] = cleanTorrents
          }
          transformed.all.push(...cleanTorrents)
        }
      })

      const filteredTransformed: Record<string, Torrent[]> = {}
      Object.entries(transformed).forEach(([provider, torrents]) => {
        if (torrents.length > 0) {
          filteredTransformed[provider] = torrents
        }
      })

      const filteredTorrents = Object.keys(filteredTransformed).reduce((acc, provider) => {
        const filtered = filteredTransformed[provider].filter((torrent) => torrent.quality);
        if (filtered.length > 0) {
          acc[provider] = filtered;
        }
        return acc;
      }, {} as Record<string, Torrent[]>);

      setProvidersTorrents(filteredTorrents);
      localStorage.setItem(`${movie.id}`, JSON.stringify(filteredTransformed))
      setShowTorrents(true)

      if (Object.keys(filteredTransformed).length === 0) {
        setError("Aucune source trouvée pour ce film")
      }
    } catch (error) {
      console.error("Error fetching torrents:", error)
      setError("Erreur lors de la recherche de sources")
      setProvidersTorrents({})
    } finally {
      setIsLoading(false)
      setIsFetching(false)
    }
  }

  useEffect(() => {
    const checkMovieStatus = async () => {
      if (movie && movie.id) {
        const isAvail = await isAvailable(movie.id);
        if (isAvail) {
          setIsPlayable(true);
        } else {
          const isDownloading = await checkDownload(movie.id);
          if (isDownloading) {
            pollDownloadStatus(movie.id);
          }
        }
      }
    };

    checkMovieStatus();
  }, [movie, isAvailable, checkDownload, pollDownloadStatus]);


  const downloadTorrent = async (info_hash: string, movieId: number) => {
    try {
      const hashValue = info_hash.includes("magnet:")
        ? info_hash.match(/xt=urn:btih:([a-zA-Z0-9]+)/)?.[1] || info_hash
        : info_hash

      localStorage.removeItem(`${movieId}`)
      const response = await fetch(`http://localhost:3333/api/stream/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
        body: JSON.stringify({
          magnet: `magnet:?xt=urn:btih:${hashValue}`,
          streamId: movieId.toString(),
        }),
      })
      if (!response.ok) {
        throw new Error(`Failed to start stream: ${response.status}`)
      }

      localStorage.removeItem(`${movieId}`)
      await addMovie(movie);
      setIsDownloading(true)
      setShowTorrents(false)
      setIsFetching(false)
      window.location.reload()
      //pollDownloadStatus(movieId)
    } catch (error) {
      console.error("Error starting stream:", error)
    }
  }

  if (!movie) {
    return <div className="text-center py-8">Movie details not available</div>
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 relative">
      <div className="md:w-1/3 lg:w-1/4">
        <img
          src={posterUrl || "/placeholder.svg"}
          alt={movie.title || "Movie poster"}
          className="w-full h-[300px] sm:h-[350px] md:h-auto rounded-lg shadow-md object-cover"
        />
      </div>
      <div className="md:w-2/3 lg:w-3/4 space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">{movie.title || "Unknown title"}</h1>
        {movie.production_companies && movie.production_companies?.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">
              {language === "en" ? "Produced by" : "Produit par"}:
            </span>
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
        {!movie.overview && <p className="text-base text-muted-foreground">
          {language === "en" ? "No description available" : "Aucun résumé disponible"}
        </p>}
        <div className="flex gap-2 mt-7">
          {isPlayable  && (
            <Link href={`/movie/${movie.id}/watch`} passHref>
              <Button
                className={`flex items-center gap-2 rounded-md ${isPlayable
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-400 text-gray-600 cursor-not-allowed"
                  } transition-all duration-200 px-4 py-2`}
                disabled={!(setIsPlayable)}
                aria-label="Play"
              >
                <Play className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {!isPlayable && (
            <Button
              className="flex-grow gap-1 backdrop-blur-sm text-black dark:text-white border-none hover:bg-white/30 cursor-pointer bg-white/50"
              onClick={fetchTorrents}
              disabled={isFetching || isDownloading}
            >
              {isFetching ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {language === "en" ? "Loading torrents..." : "Chargement des torrents..."}
                </>
              ) : isDownloading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  {language === "en" ? "Downloading..." : "Téléchargement..."}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {language === "en" ? "Download" : "Télécharger"}
                </>
              )}
            </Button>
          )}
          {/* {user && user?.user && user.user.role === "admin" && isPlayable && (
                      <Button
                      className="flex-grow gap-1 bg-red-500 text-white border-none hover:bg-red-600 cursor-pointer"
                      onClick={() => deleteM(movie.id)}
                      disabled={isLoading || isDownloading}
                      >
                      {isLoading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                      ) : (
                      <>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </>
                      )}
                      </Button> 
                    )} */}
          {trailerUrl && (
            <Link href={`https://www.youtube.com/embed/${trailerUrl}`} target="_blank" className="w-1/3">
              <Button
                className="w-full gap-1 bg-white/10 backdrop-blur-sm text-black dark:text-white border-none hover:bg-white/30 cursor-pointer"
              >
                <Clapperboard className="h-4 w-4 mr-2" />
                {language === "en" ? "Watch Trailer" : "Bande-annonce"}
              </Button>
            </Link>
          )}
        </div>
      </div>

      <TorrentModal
        isOpen={showTorrents}
        onClose={() => setShowTorrents(false)}
        movieTitle={movie.title}
        movieId={movie.id}
        providersTorrents={providersTorrents}
        isLoading={isLoading}
        error={error}
        onSelectTorrent={downloadTorrent}
      />
    </div>
  )
}