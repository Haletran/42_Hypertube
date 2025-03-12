import Link from "next/link"
import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button"


interface WatchMovieParams {
    params: {
        id: number;
    };
}

function MoviePlayer({ embedUrl }: { embedUrl: string }) {
    return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-xl bg-black">
            <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen title="Movie Player"></iframe>
        </div>
    )
}

export default async function WatchMovie({ params }: WatchMovieParams) {
    const embedUrl = `https://vidsrc.to/embed/movie/${params.id}`;
    //const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="flex items-center justify-between">
                <Link href="/" passHref>
                    <Button className="gap-2 hover:bg-gray-700">
                        <ChevronLeft className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
            <div className="w-full max-w-4xl mt-4 flex justify-center">
                <MoviePlayer embedUrl={embedUrl} />
            </div>
        </div>
    );
}