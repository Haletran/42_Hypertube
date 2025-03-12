import Link from "next/link"
import { ChevronLeft, Star, Calendar, Clock } from "lucide-react";
import { Button } from "@/app/components/ui/button"
import { MoviePlayer } from "@/app/components/MoviePlayer"
import { Badge } from "@/app/components/ui/badge"

interface WatchMovieParams {
    params: {
        id: number;
    };
}

async function getEmbedUrl(id: number): Promise<string> {
    try {
        const response = await fetch(`http://localhost:3333/api/movies/watch/${id}`);

        if (!response.ok) {
            throw new Error(`Error fetching movie: ${response.status}`);
        }

        const embedUrl = await response.text();

        if (!embedUrl) {
            throw new Error('Empty embed URL returned');
        }
        return embedUrl;
    } catch (error) {
        console.error('Failed to fetch movie:', error);
        throw new Error('Failed to load movie');
    }
}


async function getMovieDetails(id: number) {
    try {
        const response = await fetch(`http://localhost:3333/api/movie/${id}?language=fr`, {
            next: { revalidate: 3600 },
        })

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


function MovieDetails({ movie }: { movie: any }) {
    if (!movie) {
        return <div className="text-center py-8">Movie details not available</div>
    }

    const posterUrl = movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : "/placeholder.svg?height=750&width=500"

    return (
        <div className="space-y-6">
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

                    <div className="flex flex-wrap gap-2">
                        {movie.genres?.map((genre: any) => (
                            <Badge key={genre.id} variant="secondary">
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

                    {movie.production_companies?.length > 0 && (
                        <div className="pt-2">
                            <p className="text-sm font-medium">Production:</p>
                            <p className="text-sm text-muted-foreground">
                                {movie.production_companies.map((company: any) => company.name).join(", ")}
                            </p>
                        </div>
                    )}

                    {movie.tagline && <div className="italic text-muted-foreground mt-2">"{movie.tagline}"</div>}
                </div>
            </div>
        </div>
    )
}

export default async function WatchMovie({ params }: WatchMovieParams) {
    let embedUrl: string;
    let movie: any;
    try {
        embedUrl = await getEmbedUrl(params.id);
        movie = await getMovieDetails(params.id);
    } catch (error) {
        return <div className="text-center p-4">Error loading movie</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="flex items-center justify-between">
                <Link href="/" passHref>
                    <Button className="gap-2 hover:bg-white/10">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
            <div className="w-full max-w-4xl mt-4 flex flex-col gap-6">
                {embedUrl && (
                    <div className="w-full">
                        <MoviePlayer embedUrl={embedUrl} />
                    </div>
                )}
                {movie && <MovieDetails movie={movie} />}
            </div>
        </div>
    );
}