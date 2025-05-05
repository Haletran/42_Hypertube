"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { useMovieContext } from "@/contexts/MovieContext"
import { useEffect, useState } from "react"
import type { WatchedMovie } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { Clock, Calendar, Mail, Globe, User, BookUser } from "lucide-react"
import Cookies from "js-cookie"
import { Switch } from "@/app/components/ui/switch"

export default function SettingsPage() {
  const { user, setNsfw } = useAuth()
  const { fetchUserMovies } = useMovieContext()
  const { id, username, email, language, createdAt, profilePicture, role, firstName, lastName } = user?.user || {}
  const [movies, setMovies] = useState<WatchedMovie[]>([])
  const [lang, setLang] = useState<string>("en")
  const [showNsfw, setShowNsfw] = useState<boolean>(false)

  useEffect(() => {
    // Set language after component mounts to avoid hydration mismatch
    setLang(language || Cookies.get("language") || "en")
  }, [language])

  useEffect(() => {
    const nsfwPref = user?.user.nsfw;
    console.log("NSFW Preference:", nsfwPref);
    setShowNsfw(nsfwPref);
  }, [])

  const convertTimecode = (timecode: string) => {
    const seconds = Number.parseFloat(timecode)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m${remainingSeconds}s`
  }

  const convertMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h${remainingMinutes}m`
  }

  const handleNsfwToggle = async (checked: boolean) => {
    setShowNsfw(checked)
    await setNsfw(checked)
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      const watched = await fetchUserMovies(id)
      setMovies(watched)
    }
    fetchData()
  }, [id])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r bg-white bg-clip-text text-transparent">Profile</h1>
          <Badge className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1">
            {movies.length} {lang === "en" ? "watched movies" : "films regardés"}
          </Badge>
        </div>

        <Separator className="my-6 bg-zinc-800" />

        <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl mb-8 backdrop-blur-sm">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <Avatar className="h-24 w-24 border-4 border-zinc-800 shadow-md">
                <AvatarImage
                  src={profilePicture || "/placeholder.svg"}
                  alt="Profile Picture"
                  className="object-cover"
                />
                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-2xl">
                  {username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-2xl font-bold text-white">{username}</h2>
                <p className="text-zinc-500">{`${firstName} ${lastName}`}</p>
                <p className="text-zinc-400">{email}</p>
                <Badge variant="outline" className="mt-2 border-zinc-700 text-zinc-300">
                  {language}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <Separator className="my-4 bg-zinc-800" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 text-zinc-300 group">
                <div className="p-2 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
                  <User className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">ID</p>
                  <p className="text-sm font-medium text-zinc-300 truncate max-w-[250px]">{id}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-zinc-300 group">
                <div className="p-2 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
                  <Mail className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Email</p>
                  <p className="text-sm font-medium text-zinc-300">{email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-zinc-300 group">
                <div className="p-2 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
                  <BookUser className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Role</p>
                  <p className="text-sm font-medium text-zinc-300">{role}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-zinc-300 group">
                <div className="p-2 rounded-full bg-zinc-800/50 group-hover:bg-zinc-800 transition-colors">
                  <Calendar className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400" />
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{lang === "en" ? "Joined" : "Rejoint"}</p>
                  <p className="text-sm font-medium text-zinc-300">
                    {createdAt
                      ? new Date(createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-4 bg-zinc-800" />

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3 text-zinc-300">
                <div className="p-2 rounded-full bg-zinc-800/50">
                  <Globe className="h-5 w-5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-300">
                    {lang === "en" ? "Show NSFW Content" : "Afficher le contenu NSFW"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {lang === "en"
                      ? "Display adult content in search results and recommendations"
                      : "Afficher le contenu pour adultes dans les résultats de recherche et les recommandations"}
                  </p>
                </div>
              </div>
              <Switch
                checked={showNsfw}
                onCheckedChange={handleNsfwToggle}
                className="data-[state=checked]:bg-blue-400"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Clock className="mr-2 h-5 w-5 text-zinc-400" />
              {lang === "en" ? "Watched Movies" : "Films Regardés"}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            {movies.length > 0 ? (
              <ul className="space-y-6">
                {movies.map((movie) => (
                  <li key={movie.id} className="group">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-16 w-16 rounded-md border border-zinc-800 shadow-md transition-transform group-hover:scale-105">
                        <AvatarImage
                          src={"https://image.tmdb.org/t/p/w500" + movie.movie.poster_path}
                          alt={movie.movie.title}
                          className="object-cover rounded-md"
                        />
                        <AvatarFallback className="bg-zinc-800 text-zinc-300 rounded-md">
                          {movie.movie.title?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="font-semibold text-zinc-200 mb-2 group-hover:text-white transition-colors">
                          {movie.movie.title}
                        </p>

                        <div className="w-full bg-zinc-800 rounded-full h-2 mb-1 overflow-hidden">
                          <div
                            className="bg-blue-400 h-2 rounded-full transition-all duration-500 ease-in-out"
                            style={{
                              width: `${Math.min(100, (Number.parseFloat(movie.watchedTimecode) / (movie.originalTimecode * 60)) * 100)}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-400 font-medium">{convertTimecode(movie.watchedTimecode)}</span>
                          <span className="text-zinc-500">{convertMinutesToHours(movie.originalTimecode)}</span>
                        </div>
                      </div>
                    </div>

                    {movies.indexOf(movie) < movies.length - 1 && <Separator className="mt-6 bg-zinc-800" />}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-400">
                  {lang === "en" ? "No watched movies yet." : "Aucun film regardé pour le moment."}
                </p>
                <p className="text-zinc-500 text-sm mt-2">
                  {lang === "en"
                    ? "Start watching movies to see them here."
                    : "Commencez à regarder des films pour les voir ici."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
