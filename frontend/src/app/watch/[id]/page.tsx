import Link from "next/link"
import { MoviePlayer } from "@/app/components/MoviePlayer"
import { BackButton } from "@/app/components/ui/backButton";

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


export default async function WatchMovie({ params }: WatchMovieParams) {
    let embedUrl: string;

    try {
        embedUrl = await getEmbedUrl(params.id);
    } catch (error) {
        return <div className="text-center p-4">Error loading movie</div>;
    }

    return (
        <div className="flex flex-col items-center justify-center  p-4">
            <div className="w-full max-w-7xl  flex flex-col gap-6 container mx-auto p-4">
                <BackButton backUrl={`/movie/${params.id}`} />
                {embedUrl && (
                    <div className="w-full">
                        <MoviePlayer embedUrl={embedUrl} />
                    </div>
                )}
            </div>
        </div>
    );
}