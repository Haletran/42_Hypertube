"use client"

import { useEffect, useState, useRef } from "react"
import { Loader, Filter, X, ChevronDown, Star, ArrowUp } from "lucide-react"
import { MovieCard } from "./MovieCard"
import { useAuth } from "@/contexts/AuthContext"
import type { Movie, MovieGridProps } from "@/types"
import { useMovieContext } from "@/contexts/MovieContext"
import Cookies from "js-cookie"
import { WatchCard } from "./WatchCard"
import { Slider } from "@/app/components/ui/slider"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Separator } from "@/app/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/app/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select"
import Link from "next/link"



const DEFAULT_YEAR = 2025
const DEFAULT_RATING = -1

export function MovieGrid({ language, onMovieSelect }: MovieGridProps) {
  const { user } = useAuth()
  const { fetchUserMovies, watchedMovies, setWatchedMovies } = useMovieContext()
  const { error, setError, loading, setLoading } = useAuth()
  const [discover, setDiscover] = useState<Movie[]>([])
  const [pagenumber, setpagenumber] = useState<number>(1)
  const [firstLoad, setFirstLoad] = useState<boolean>(true)
  const [filter, setFilter] = useState<string>("")
  const [sort, setSort] = useState<string>("")
  const [watchedLoading, setWatchedLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [activeFilterTypes, setActiveFilterTypes] = useState<{
    year: boolean
    rating: boolean
    genres: boolean
  }>({
    year: false,
    rating: false,
    genres: false,
  })

  const [tempFilters, setTempFilters] = useState({
    year: DEFAULT_YEAR,
    rating: DEFAULT_RATING,
    genres: [] as number[],
  })

  const [appliedFilters, setAppliedFilters] = useState({
    year: DEFAULT_YEAR,
    rating: DEFAULT_RATING,
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
      const response = await fetch(`/api/movies/popular?page=${pagenumber}&language=${language}&sort_by=${sort}${filterQuery}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      const data = await response.json()
      if (data.results.length === 0) {
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

    if (activeFilterTypes.year && tempFilters.year !== DEFAULT_YEAR) {
      newFilter += `&primary_release_year=${tempFilters.year}`
    }

    if (activeFilterTypes.rating && tempFilters.rating !== DEFAULT_RATING) {
      newFilter += `&vote_average.gte=${tempFilters.rating}&vote_average.lte=${tempFilters.rating}`
    }

    if (tempFilters.genres.length > 0) {
      newFilter += `&with_genres=${tempFilters.genres.join(",")}`
      setActiveFilterTypes((prev) => ({ ...prev, genres: true }))
    }

    setAppliedFilters({ ...tempFilters })
    setFilter(newFilter)
    setDiscover([])
    setpagenumber(1)
    setIsMenuOpen(false)
  }

  const handleYearChange = (value: number) => {
    setTempFilters((prev) => ({ ...prev, year: value }))
    setActiveFilterTypes((prev) => ({ ...prev, year: true }))
  }

  const handleRatingChange = (value: number) => {
    setTempFilters((prev) => ({ ...prev, rating: value }))
    setActiveFilterTypes((prev) => ({ ...prev, rating: true }))
  }

  const toggleGenre = (genreId: number) => {
    setTempFilters((prev) => {
      const isSelected = prev.genres.includes(genreId)
      if (isSelected) {
        const newGenres = prev.genres.filter((id) => id !== genreId)
        if (newGenres.length === 0) {
          setActiveFilterTypes((prevTypes) => ({ ...prevTypes, genres: false }))
        }
        return {
          ...prev,
          genres: newGenres,
        }
      } else {
        setActiveFilterTypes((prevTypes) => ({ ...prevTypes, genres: true }))
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
      newTempFilters.year = DEFAULT_YEAR
      setActiveFilterTypes((prev) => ({ ...prev, year: false }))
      newFilter = newFilter.replace(/&primary_release_year=\d+/, "")
    } else if (type === "rating") {
      newTempFilters.rating = DEFAULT_RATING
      setActiveFilterTypes((prev) => ({ ...prev, rating: false }))
      newFilter = newFilter.replace(/&vote_average\.gte=\d+&vote_average\.lte=\d+/, "")
    } else if (type === "genre" && genreId) {
      newTempFilters.genres = newTempFilters.genres.filter((id) => id !== genreId)

      if (newTempFilters.genres.length === 0) {
        setActiveFilterTypes((prev) => ({ ...prev, genres: false }))
      }

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
      year: DEFAULT_YEAR,
      rating: DEFAULT_RATING,
      genres: [],
    })
    setAppliedFilters({
      year: DEFAULT_YEAR,
      rating: DEFAULT_RATING,
      genres: [],
    })
    setActiveFilterTypes({
      year: false,
      rating: false,
      genres: false,
    })
    setFilter("")
    setDiscover([])
    setpagenumber(1)
  }

  const applySort = (value: string) => {
    setSort(value)
    setDiscover([])
    setpagenumber(1)
  }

  // useEffect(() => {
  //   setpagenumber(1)
  //   fetchDiscover()
  // }, [filter, sort])

  useEffect(() => {
    const loadData = async () => {
      if (user?.user?.id) {
        setWatchedLoading(true);
        const check = await fetchUserMovies(user?.user?.id);
        setWatchedMovies(check);
        setWatchedLoading(false);
      }
      
      const debounceTimeout = setTimeout(() => {
        fetchDiscover();
        if (firstLoad) {
          setFirstLoad(false);
        }
      }, 500);
      
      return () => clearTimeout(debounceTimeout);
    };
    
    loadData();
  }, [onMovieSelect, filter, sort, user?.user?.id]);

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

  const activeFilterCount =
    (activeFilterTypes.year && appliedFilters.year !== DEFAULT_YEAR ? 1 : 0) +
    (activeFilterTypes.rating && appliedFilters.rating !== DEFAULT_RATING ? 1 : 0) +
    appliedFilters.genres.length


  return (
    <div className="container mx-auto p-4">
      {activeFilterCount <= 0 && sort.length <= 0 && (
        <div className="mb-8">
          {discover.length > 0 && (
            <div className="relative overflow-hidden rounded-xl bg-zinc-900 shadow-lg border border-zinc-800">
              <div className="relative w-full h-[300px]">
                <img
                  src={`https://image.tmdb.org/t/p/original${discover[0].backdrop_path || discover[0].poster_path}`}
                  alt={discover[0].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-6">
                  <h2 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">
                    {discover[0].title}
                  </h2>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center bg-black/50 rounded-md px-2 py-1">
                      <Star className="h-4 w-4 mr-1 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-medium">{discover[0].vote_average.toFixed(1)}</span>
                    </div>
                    <span className="text-white/80 text-sm">{new Date(discover[0].release_date).getFullYear()}</span>
                  </div>
                  <p className="text-white/70 line-clamp-2 mb-4 max-w-2xl">
                    {discover[0].overview}
                  </p>
                  <Link href={`/movie/${discover[0].id}`}>
                    <Button
                      className="bg-white hover:bg-zinc-200 text-black font-medium px-6 py-2 shadow-lg transition-transform hover:scale-105"
                    >
                      {language === "en" ? "Watch Now" : "Regarder maintenant"}
                      <ArrowUp className="h-4 w-4 ml-2 rotate-45" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {discover.length === 0 && !error && (
        <div className="flex justify-center items-center mt-4">
          <Loader className="animate-spin h-8 w-8 text-white" />
        </div>
      )}

      {error && <div className="bg-zinc-900 border border-zinc-700 text-white px-4 py-3 rounded">Error: {error}</div>}

      {activeFilterCount <= 0 && sort.length <= 0 && !filter && !watchedLoading && (
        <>
          {watchedMovies.length > 0 ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-6">
                {language === "en" ? "Currently watching" : "En cours"}
              </h1>
              <WatchCard movie={watchedMovies} language={language} />
              <br></br>
            </>
          ) : null}
        </>
      )}

      {discover.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">
              {language === "en" ? "Discover Movies" : "Découvrir des films"}
            </h1>
            <div className="flex items-center gap-2">
              <Select onValueChange={applySort}>
                <SelectTrigger className="w-[180px] focus:ring-0 focus:outline-none bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800">
                  <SelectValue placeholder={language === "en" ? "Sort by" : "Trier par"} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border border-zinc-800 text-white">
                  <SelectItem
                    value="popularity.desc"
                    className={`flex items-center gap-2 ${sort === "popularity.desc" ? "bg-zinc-700" : ""}`}
                  >
                    {language === "en" ? "Popularity Desc" : "Popularité Desc"}
                  </SelectItem>
                  <SelectItem
                    value="popularity.asc"
                    className={sort === "popularity.asc" ? "bg-zinc-700" : ""}
                  >
                    {language === "en" ? "Popularity Asc" : "Popularité Asc"}
                  </SelectItem>
                  <SelectItem
                    value="title.desc"
                    className={sort === "title.desc" ? "bg-zinc-700" : ""}
                  >
                    {language === "en" ? "Title Desc" : "Titre Desc"}
                  </SelectItem>
                  <SelectItem
                    value="title.asc"
                    className={sort === "title.asc" ? "bg-zinc-700" : ""}
                  >
                    {language === "en" ? "Title Asc" : "Titre Asc"}
                  </SelectItem>
                  <SelectItem
                    value="revenue.desc"
                    className={sort === "revenue.desc" ? "bg-zinc-700" : ""}
                  >
                    {language === "en" ? "Revenue Desc" : "Revenu Desc"}
                  </SelectItem>
                  <SelectItem
                    value="revenue.asc"
                    className={sort === "revenue.asc" ? "bg-zinc-700" : ""}
                  >
                    {language === "en" ? "Revenue Asc" : "Revenu Asc"}
                  </SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 bg-white border border-zinc-800 hover:bg-gray-200 text-black rounded-md px-4 py-2 transition-all duration-200"
                  >
                    <Filter className="h-4 w-4" />
                    <span>{language === "en" ? "Filters" : "Filtres"}</span>
                    <ChevronDown className="h-4 w-4 ml-1 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[340px] p-0 bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/50 rounded-md overflow-hidden mr-20"
                >
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {language === "en" ? "Filter Movies" : "Filtrer les films"}
                      </h3>
                      {activeFilterCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-8 px-2 text-zinc-400 hover:text-white hover:bg-zinc-900"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {language === "en" ? "Clear" : "Effacer"}
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {language === "en"
                        ? "Select your filters to update results"
                        : "Sélectionnez vos filtres pour mettre à jour les résultats"}
                    </p>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {/* Year Filter Section */}
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-white">{language === "en" ? "Year" : "Année"}</h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`bg-white text-black hover:bg-zinc-200 ${activeFilterTypes.year ? "border-2 border-white" : ""
                              }`}
                          >
                            {tempFilters.year}
                          </Badge>
                        </div>
                      </div>
                      <Slider
                        defaultValue={[tempFilters.year]}
                        value={[tempFilters.year]}
                        min={1920}
                        max={2025}
                        step={1}
                        className="py-4"
                        onValueChange={(value) => handleYearChange(value[0])}
                      />
                      <div className="flex justify-between text-xs text-zinc-500 px-1">
                        <span>1920</span>
                        <span>2025</span>
                      </div>
                    </div>

                    <Separator className="bg-zinc-800" />

                    {/* Rating Filter Section */}
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-white">
                          {language === "en" ? "Minimum Rating" : "Note minimale"}
                        </h4>
                        {tempFilters.rating !== DEFAULT_RATING && (
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`bg-white text-black hover:bg-zinc-200 ${activeFilterTypes.rating ? "border-2 border-white" : ""
                                }`}
                            >
                              {tempFilters.rating}/10
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-center py-4">
                        {[...Array(10)].map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleRatingChange(index + 1)}
                            className="px-1 focus:outline-none transition-all duration-200 hover:scale-125 relative"
                          >
                            <Star
                              fill={index < tempFilters.rating ? "#FFFFFF" : "none"}
                              className={index < tempFilters.rating ? "text-white" : "text-zinc-700"}
                              size={22}
                            />
                            {index < tempFilters.rating && (
                              <span className="absolute inset-0 animate-pulse opacity-30 rounded-full bg-white blur-sm -z-10"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-zinc-800" />

                    {/* Genres Filter Section */}
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium text-white">{language === "en" ? "Genres" : "Genres"}</h4>
                        <Badge className="bg-white text-black hover:bg-zinc-200">{tempFilters.genres.length}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {genres.map((genre) => (
                          <button
                            key={genre.id}
                            onClick={() => toggleGenre(genre.id)}
                            className={`group px-3 py-1.5 rounded-md text-sm transition-all duration-200 flex items-center gap-1.5
                      ${tempFilters.genres.includes(genre.id)
                                ? "bg-white text-black"
                                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                              }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center border transition-all
                      ${tempFilters.genres.includes(genre.id)
                                  ? "border-black bg-black"
                                  : "border-zinc-600 group-hover:border-zinc-400"
                                }`}
                            >
                              {tempFilters.genres.includes(genre.id) && <X className="w-2.5 h-2.5 text-white" />}
                            </span>
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex justify-end">
                    <Button onClick={applyFilters} className="bg-white hover:bg-zinc-200 text-black">
                      {language === "en" ? "Apply Filters" : "Appliquer les filtres"}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2">
                {activeFilterTypes.year && appliedFilters.year !== DEFAULT_YEAR && (
                  <Badge className="flex items-center gap-1 bg-zinc-800 text-white hover:bg-zinc-700">
                    {language === "en" ? "Year" : "Année"}: {appliedFilters.year}
                    <button onClick={() => removeFilter("year")} className="ml-1 hover:text-zinc-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {activeFilterTypes.rating && appliedFilters.rating !== DEFAULT_RATING && (
                  <Badge className="flex items-center gap-1 bg-zinc-800 text-white hover:bg-zinc-700">
                    {language === "en" ? "Rating" : "Note"}: {appliedFilters.rating}/10
                    <button onClick={() => removeFilter("rating")} className="ml-1 hover:text-zinc-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}

                {appliedFilters.genres.map((genreId) => (
                  <Badge key={genreId} className="flex items-center gap-1 bg-zinc-800 text-white hover:bg-zinc-700">
                    {getGenreNameById(genreId)}
                    <button onClick={() => removeFilter("genre", genreId)} className="ml-1 hover:text-zinc-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-zinc-400 hover:text-white hover:bg-transparent"
                  >
                    {language === "en" ? "Clear All" : "Effacer tout"}
                  </Button>
                )}
              </div>
            </div>
          )}
          <MovieCard movies={discover} observerRef={observerRef} loadState={loading} language={language} />
        </>
      )}
    </div>
  )
}
