import { CastScrollableList } from "@/app/components/CastScrollableList"
import { BackButton } from "@/app/components/ui/backButton";
import { MovieDetails } from "@/app/components/MovieOverview";
import { CommentSection } from "@/app/components/CommentSection";


interface WatchMovieParams {
    params: {
        id: number;
    };
}

export async function getMovieDetails(id: number) {
    try {
        const response = await fetch(`http://backend:3333/api/movies/${id}?language=fr`)

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
    const movieId = params.id;
    let movie: any;
    let trailer: any;

    try {
        trailer = await getMovieTrailer(movieId);
        movie = await getMovieDetails(movieId);
    } catch (error) {
        return <div className="text-center p-4">Error loading movie</div>;
    }

    console.log(movie);

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl flex flex-col gap-3">
                <BackButton backUrl="/" />
                {movie && (
                    <>
                        <MovieDetails movie={movie} trailerUrl={trailer?.key || ''} />
                        <CastScrollableList movie={movie} />
                        <CommentSection movie_id={movie.movie_id} />
                    </>
                )}
            </div>
        </div >
    );
}