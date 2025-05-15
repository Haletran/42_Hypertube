import Link from "next/link"

interface FooterProps {
  companyName?: string
}

export function Footer({ companyName = "Hypertube" }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-3 sm:py-6 px-4 md:px-6 fixed bottom-0">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
      <div className="text-zinc-400 text-xs sm:text-sm mb-2 sm:mb-0">
        Made by{" "}
        <Link
        href="https://github.com/fZpHr"
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-300 hover:text-white transition-colors"
        >
        Hbelle
        </Link>{" "}
        and{" "}
        <Link
        href="https://github.com/Haletran"
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-300 hover:text-white transition-colors"
        >
        Bapasqui
        </Link>
      </div>

      <div className="text-zinc-500 text-xs sm:text-sm">
        &copy; {currentYear} {companyName}
      </div>
      </div>
    </footer>
  )
}
