import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-white">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">Hypertube</h1>
        </div>

        <p className="text-lg md:text-xl text-zinc-400 mb-12 max-w-md mx-auto">Stream any Movies</p>

        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center px-6 py-4 text-lg font-medium text-black bg-white rounded-md hover:bg-gray-300 transition-colors duration-300 shadow-lg shadow-black/30"
        >
          Start Watching Now
        </Link>
      </div>

      <div className="absolute bottom-6 text-xs text-zinc-500">&copy; {new Date().getFullYear()} Hypertube</div>
    </div>
  )
}

