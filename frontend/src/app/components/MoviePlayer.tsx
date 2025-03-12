export function MoviePlayer({ embedUrl }: { embedUrl: string }) {
    return (
        <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-xl bg-black">
            <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen title="Movie Player"></iframe>
        </div>
    )
}