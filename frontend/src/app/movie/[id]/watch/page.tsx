import { BackButton } from "@/app/components/ui/backButton";
import Player from "@/app/components/Player";
import { WatchMovieParams } from "@/types";
import { Navbar } from "@/app/components/ui/navbar";


export default async function WatchMovie({ params }: WatchMovieParams) {
    const { id } = await params;

    return (
        <div className="flex flex-col items-center justify-center  p-4">
            <div className="w-full max-w-7xl  flex flex-col gap-6 container mx-auto p-4">
                <BackButton backUrl={`/movie/${id}`} />
                <Player streamId={id.toString()} />
            </div>
        </div>
    );
}