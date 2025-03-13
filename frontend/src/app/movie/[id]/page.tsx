import Link from "next/link"
import { Star, Calendar, Clock, Play, Clapperboard } from "lucide-react";
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { CastScrollableList } from "@/app/components/CastScrollableList"
import { BackButton } from "@/app/components/ui/backButton";

interface WatchMovieParams {
    params: {
        id: number;
    };
}

export async function getMovieDetails(id: number) {
    try {
        const response = await fetch(`http://localhost:3333/api/movies/${id}?language=fr`)

        if (!response.ok) {
            throw new Error(`Failed to fetch movie details: ${response.status}`)
        }

        const movie = await response.json();
        return movie;
    } catch (error) {
        console.error("Error fetching movie details:", error)
        throw error
    }
}


function MovieDetails({ movie, trailerUrl }: { movie: any; trailerUrl: string }) {
    if (!movie) {
        return <div className="text-center py-8">Movie details not available</div>
    }

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "/placeholder.svg?height=750&width=500"

    return (
        <div className="flex flex-col md:flex-row gap-6">

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
                <div className="flex gap-2 mt-7">
                    <Link href={`/watch/${movie.id}`} className="flex-grow">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-full gap-1 bg-white/50 backdrop-blur-sm text-white border-none hover:bg-white/30 cursor-pointer">
                            <Play className="h-4 w-4 mr-2" />
                            Play
                        </Button>
                    </Link>
                    <Link href={`https://www.youtube.com/embed/${trailerUrl}`} target="_blank" className="w-1/3">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="w-full gap-1 bg-white/10 backdrop-blur-sm text-white border-none hover:bg-white/30 cursor-pointer">
                            <Clapperboard className="h-4 w-4 mr-2" />
                            Watch Trailer
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}


export async function getMovieTrailer(movieId: number) {
    const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${tmdbApiKey}&language=fr`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch trailer data');
    }

    const data = await response.json();

    const trailers = data.results.filter(
        (video: any) =>
            video.site === "YouTube" &&
            (video.type === "Trailer" || video.type === "Teaser")
    );

    return trailers.length > 0 ? trailers[0] : null;
}

export default async function WatchMovie({ params }: WatchMovieParams) {
    let movie: any;
    let trailer: any;

    try {
        trailer = await getMovieTrailer(params.id);
        movie = await getMovieDetails(params.id);
    } catch (error) {
        return <div className="text-center p-4">Error loading movie</div>;
    }

    console.log(movie);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl flex flex-col gap-3">
                <BackButton backUrl="/" />
                {movie && trailer && <MovieDetails movie={movie} trailerUrl={trailer?.key || ''} />}
                {movie && <CastScrollableList movie={movie} />}
            </div>
        </div >
    );
}