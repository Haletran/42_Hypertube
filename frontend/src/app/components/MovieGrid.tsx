"use client"

import { useEffect, useState, useRef } from "react"
import { Loader, Filter, X } from "lucide-react"
import { MovieCard } from "./MovieCard"
import { useAuth } from "@/contexts/AuthContext"
import type { Movie, MovieGridProps } from "@/types"
import { useMovieContext } from "@/contexts/MovieContext"
import Cookies from "js-cookie"
import { WatchCard } from "./WatchCard"
import { Slider } from "@/app/components/ui/slider"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/app/components/ui/sheet"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { set } from "zod"

export function MovieGrid({ language, onMovieSelect }: MovieGridProps) {
  const { user } = useAuth()
  const { fetchUserMovies, watchedMovies, setWatchedMovies } = useMovieContext()
  const { error, setError, loading, setLoading } = useAuth()
  const [discover, setDiscover] = useState<Movie[]>([])
  const [pagenumber, setpagenumber] = useState<number>(1)
  const [firstLoad, setFirstLoad] = useState<boolean>(true)
  const [filter, setFilter] = useState<string>("")

  const [tempFilters, setTempFilters] = useState({
    year: 2025,
    rating: 5,
    genres: [] as number[],
  })

  const [appliedFilters, setAppliedFilters] = useState({
    year: 2025,
    rating: 5,
    genres: [] as number[],
  })

  const observerRef = useRef(null)

  const genres = [
    { id: 28, name: language === "en" ? "Action" : "Action" },
    { id: 12, name: language === "en" ? "Adventure" : "Aventure" },
    { id: 16, name: language === "en" ? "Animation" : "Animation" },
    { id: 35, name: language === "en" ? "Comedy" : "Comédie" },
    { id: 80, name: language === "en" ? "Crime" : "Crime" },
    { id: 99, name: language === "en" ? "Documentary" : "Documentaire" },
    { id: 18, name: language === "en" ? "Drama" : "Drame" },
    { id: 10751, name: language === "en" ? "Family" : "Famille" },
    { id: 14, name: language === "en" ? "Fantasy" : "Fantastique" },
    { id: 36, name: language === "en" ? "History" : "Histoire" },
    { id: 27, name: language === "en" ? "Horror" : "Horreur" },
  ]

  const fetchDiscover = async () => {
    try {
      setLoading(true)
      const filterQuery = filter ? `&filter=${encodeURIComponent(filter)}` : ""
      console.log("Fetching movies with filter:", filter)
      const response = await fetch(`/api/movies/popular?page=${pagenumber}&language=${language}${filterQuery}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      console.log("Received movies data:", data, filterQuery, pagenumber)

      if (data.results.length === 0) {
        console.log("No more movies to load")
        setLoading(false)
        return
      }
      if (pagenumber === 1) {
        setDiscover(data.results)
      } else {
        setDiscover((prev) => {
          const existingMovieIds = new Set(prev.map((movie) => movie.id))
          const newMovies = data.results.filter((movie: Movie) => !existingMovieIds.has(movie.id))
          return [...prev, ...newMovies]
        })
      }
      setpagenumber((prev) => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let newFilter = ""

    if (tempFilters.year) {
      newFilter += `&primary_release_year=${tempFilters.year}`
    }

    if (tempFilters.rating) {
      newFilter += `&vote_average.gte=${tempFilters.rating}&vote_average.lte=${tempFilters.rating}`
    }

    if (tempFilters.genres.length > 0) {
      newFilter += `&with_genres=${tempFilters.genres.join(",")}`
    }
    setAppliedFilters({ ...tempFilters })
    setFilter(newFilter)
    setDiscover([])
    setpagenumber(1)
  }

  const toggleGenre = (genreId: number) => {
    setTempFilters((prev) => {
      const isSelected = prev.genres.includes(genreId)
      if (isSelected) {
        return {
          ...prev,
          genres: prev.genres.filter((id) => id !== genreId),
        }
      } else {
        return {
          ...prev,
          genres: [...prev.genres, genreId],
        }
      }
    })
  }

  const removeFilter = (type: "year" | "rating" | "genre", genreId?: number) => {
    const newTempFilters = { ...tempFilters }
    let newFilter = filter

    if (type === "year") {
      newTempFilters.year = 2025
      newFilter = newFilter.replace(/&primary_release_year=\d+/, "")
    } else if (type === "rating") {
      newTempFilters.rating = 5
      newFilter = newFilter.replace(/&vote_average\.gte=\d+&vote_average\.lte=\d+/, "")
    } else if (type === "genre" && genreId) {
      newTempFilters.genres = newTempFilters.genres.filter((id) => id !== genreId)

      const genreRegex = /&with_genres=[\d,]+/
      const genreMatch = newFilter.match(genreRegex)

      if (genreMatch) {
        const currentGenres = genreMatch[0].replace("&with_genres=", "").split("|").map(Number)
        const updatedGenres = currentGenres.filter((id) => id !== genreId)

        if (updatedGenres.length === 0) {
          newFilter = newFilter.replace(genreRegex, "")
        } else {
          newFilter = newFilter.replace(genreRegex, `&with_genres=${updatedGenres.join(",")}`)
        }
      }
    }

    setTempFilters(newTempFilters)
    setAppliedFilters({ ...newTempFilters })
    setFilter(newFilter)
    setDiscover([])
    setpagenumber(1)
  }

  const clearAllFilters = () => {
    setTempFilters({
      year: 2025,
      rating: 5,
      genres: [],
    })
    setAppliedFilters({
      year: 2025,
      rating: 5,
      genres: [],
    })
    setFilter("")
    setDiscover([])
    setpagenumber(1)
  }

  useEffect(() => {
    fetchDiscover()
  }, [filter])

  useEffect(() => {
    const test = async () => {
      const check = await fetchUserMovies(user?.user?.id)
      setWatchedMovies(check)
    }
    const debounceTimeout = setTimeout(() => {
      fetchDiscover()
      if (firstLoad) {
        setFirstLoad(false)
        fetchDiscover()
      }
    }, 500)
    test()
    return () => clearTimeout(debounceTimeout)
  }, [onMovieSelect])

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current) {
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          fetchDiscover()
          observer.unobserve(entry.target)
        }
      },
      { threshold: 1.0 },
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }
    return () => observer.disconnect()
  }, [discover])

  const getGenreNameById = (id: number) => {
    const genre = genres.find((g) => g.id === id)
    return genre ? genre.name : ""
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {language === "en" ? "Filters" : "Filtres"}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>{language === "en" ? "Filter Movies" : "Filtrer les films"}</SheetTitle>
                <SheetDescription>
                  {language === "en"
                    ? "Select your filters and click Apply to update results."
                    : "Sélectionnez vos filtres et cliquez sur Appliquer pour mettre à jour les résultats."}
                </SheetDescription>
              </SheetHeader>

              <div className="py-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">
                      {language === "en" ? "Year" : "Année"}: {tempFilters.year}
                    </p>
                  </div>
                  <Slider
                    defaultValue={[tempFilters.year]}
                    value={[tempFilters.year]}
                    min={1920}
                    max={2025}
                    step={1}
                    onValueChange={(value) => setTempFilters((prev) => ({ ...prev, year: value[0] }))}
                  />
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {language === "en" ? "Minimum Rating" : "Note minimale"}
                      </h3>
                      <span className="text-lg font-medium text-white">
                        {tempFilters.rating}/10
                      </span>
                    </div>
                    <div className="flex items-center justify-center py-2">
                      {[...Array(10)].map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setTempFilters((prev) => ({ ...prev, rating: index + 1 }))}
                          className="px-1 focus:outline-none transition-transform duration-200 hover:scale-110"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill={index < tempFilters.rating ? "#FFD700" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={
                              index < tempFilters.rating ? "text-yellow-500" : "text-slate-300 dark:text-slate-600"
                            }
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{language === "en" ? "Genres" : "Genres"}:</p>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        onClick={() => toggleGenre(genre.id)}
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-200 hover:scale-105 ${tempFilters.genres.includes(genre.id)
                            ? "bg-white text-black "
                            : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <SheetFooter className="flex-col sm:flex-row gap-2">
                {filter && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    {language === "en" ? "Clear All" : "Effacer tout"}
                  </Button>
                )}
                <SheetClose asChild>
                  <Button onClick={applyFilters}>
                    {language === "en" ? "Apply Filters" : "Appliquer les filtres"}
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {discover.length === 0 && !error && (
        <div className="flex justify-center items-center mt-4">
          <Loader className="animate-spin h-8 w-8" />
        </div>
      )}

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div>}

      {watchedMovies.length > 0 && (
        <>
          <WatchCard movie={watchedMovies} language={language} />
          <br></br>
        </>
      )}

      {discover.length > 0 && (
        <>
          {language === "en" ? (
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Discover Movies</h1>
          ) : (
            language === "fr" && (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Découvrir des films</h1>
            )
          )}
          {(appliedFilters.year !== 2025 || appliedFilters.rating !== 5 || appliedFilters.genres.length > 0) && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2">
                {appliedFilters.year !== 2025 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {language === "en" ? "Year" : "Année"}: {appliedFilters.year}
                    <button onClick={() => removeFilter("year")} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {appliedFilters.rating !== 5 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {language === "en" ? "Rating" : "Note"}: {appliedFilters.rating}/10
                    <button onClick={() => removeFilter("rating")} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {appliedFilters.genres.map((genreId) => (
                  <Badge key={genreId} variant="secondary" className="flex items-center gap-1">
                    {getGenreNameById(genreId)}
                    <button onClick={() => removeFilter("genre", genreId)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs text-gray-500 hover:text-red-500"
                >
                  {language === "en" ? "Clear All" : "Effacer tout"}
                </Button>
              </div>
            </div>
          )}
          <MovieCard movies={discover} observerRef={observerRef} loadState={loading} language={language} />
        </>
      )}
    </div>
  )
}
