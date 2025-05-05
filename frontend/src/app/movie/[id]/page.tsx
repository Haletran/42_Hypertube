import { CastScrollableList } from "@/app/components/CastScrollableList"
import { MovieDetails } from "@/app/components/MovieOverview";
import { CommentSection } from "@/app/components/CommentSection";
import { MovieContext } from "@/contexts/MovieContext";
import { cookies } from 'next/headers';

async function getMovieDetails(id: number, language: string) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;
        const response = await fetch(`http://backend:3333/api/movies/${id}?language=${language}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
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

async function getMovieTrailer(movieId: number, language: string) {
    const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
    const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${tmdbApiKey}&language=${language}`
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

export default async function WatchMovie({ params, searchParams }: {
    params: { id: number },
    searchParams: { language?: string }
}) {

    const movieId = params.id;
    const cookieStore = cookies();
    const language = searchParams.language || cookieStore.get('language')?.value || 'en';
    let movie: any;
    let trailer: any;

    try {
        trailer = await getMovieTrailer(movieId, language);
        movie = await getMovieDetails(movieId, language);
    } catch (error) {
        return <div className="text-center p-4">Error loading movie</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl flex flex-col gap-3">
                {movie && (
                    <>
                        <MovieDetails movie={movie} trailerUrl={trailer?.key || ''} />
                        <CastScrollableList movie={movie} />
                        <CommentSection movie_id={movieId} />
                    </>
                )}
            </div>
        </div>
    );
}
