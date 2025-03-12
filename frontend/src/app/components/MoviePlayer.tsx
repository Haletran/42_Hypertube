export function MoviePlayer({ embedUrl }: { embedUrl: string }) {
    return (
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-xl bg-black">
            <iframe src={embedUrl} className="w-full h-full border-none" allowFullScreen title="Movie Player"></iframe>
        </div>
    )
}