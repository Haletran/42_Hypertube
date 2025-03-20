import { BackButton } from "@/app/components/ui/backButton";
import Player from "@/app/components/Player";

interface WatchMovieParams {
    params: {
        id: number;
    };
}

async function getEmbedUrl(id: number): Promise<string> {
    try {
        const response = await fetch(`http://backend:3333/api/movies/watch/${id}`);

        if (!response.ok) {
            throw new Error(`Error fetching movie: ${response.status}`);
        }
        
        const embedUrl = "stream_1742398514958_ithso"

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
    // Correctly await the entire params object
    const { id } = await params;
    
    let embedUrl: string;
    try {
        embedUrl = await getEmbedUrl(id);
    } catch (error) {
        return <div className="text-center p-4">Error loading movie</div>;
    }
    console.log(embedUrl);
    return (
        
        <div className="flex flex-col items-center justify-center  p-4">
            <div className="w-full max-w-7xl  flex flex-col gap-6 container mx-auto p-4">
                <BackButton backUrl={`/movie/${id}`} />
                <Player streamId={embedUrl} />
            </div>
        </div>
    );
}