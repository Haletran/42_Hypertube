import Link from "next/link"
import { ChevronLeft } from "lucide-react";
import { Button } from "@/app/components/ui/button"
import { MoviePlayer } from "@/app/components/MoviePlayer"

interface WatchMovieParams {
    params: {
        id: number;
    };
}

export default async function WatchMovie({ params }: WatchMovieParams) {
    const embedUrl = `https://vidsrc.to/embed/movie/${params.id}`;
    //const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";

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
            <div className="w-full max-w-4xl mt-4 flex justify-center">
                <MoviePlayer embedUrl={embedUrl} />
            </div>
        </div>
    );
}