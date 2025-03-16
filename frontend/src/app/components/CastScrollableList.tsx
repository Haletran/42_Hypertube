import { Separator } from "@/app/components/ui/separator";

function removeDuplicates(arr: any, key: any) {
    return [...new Map(arr.map((item: any) => [key(item), item])).values()];
}



export function CastScrollableList({ movie }: { movie: any }) {
    movie.credits.cast = removeDuplicates(movie.credits.cast, (actor: any) => actor.id);
    movie.credits.crew = removeDuplicates(movie.credits.crew, (crew: any) => crew.id);

    return (
        movie && movie.credits && movie.credits.cast && movie.credits.cast.length > 0 && (
            <div className="mt-4">
                <h2 className="text-xl font-semibold mb-2">Cast & Crew</h2>
                <div className="relative">
                    <div className="flex overflow-x-auto pb-2 scrollbar-hide snap-x space-x-4">
                        {movie.credits.cast.slice(0, 10).map((actor: any) => (
                            <div
                                key={actor.id}
                                className="flex-shrink-0 w-24 snap-start"
                            >
                                <div className="flex flex-col items-center">
                                    {actor.profile_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                                            alt={actor.name}
                                            className="w-20 h-20 rounded-full object-cover mb-2"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-2">
                                            <span className="text-lg text-gray-500">{actor.name[0]}</span>
                                        </div>
                                    )}
                                    <p className="text-sm font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                        {actor.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground text-gray-600 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                        {actor.character}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <Separator orientation="vertical" />
                        {movie.credits.crew.slice(0, 10).map((crew: any) => (
                            <div
                                key={crew.id}
                                className="flex-shrink-0 w-24 snap-start"
                            >
                                <div className="flex flex-col items-center">
                                    {crew.profile_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w185${crew.profile_path}`}
                                            alt={crew.name}
                                            className="w-20 h-20 rounded-full object-cover mb-2"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-2">
                                            <span className="text-lg text-gray-500">{crew.name[0]}</span>
                                        </div>
                                    )}
                                    <p className="text-sm font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                        {crew.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground text-gray-600 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                                        {crew.job}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ))
}