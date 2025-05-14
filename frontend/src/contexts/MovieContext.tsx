import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import api from '../utils/api';
import { Movie } from '@/types';
import Cookies from 'js-cookie';
import { set } from 'react-hook-form';
import { WatchedMovie } from '@/types';

interface MovieContextProps {
    movie: Movie | null;
    loading: boolean;
    error: string | null;
    watchedMovies: WatchedMovie[];
    setWatchedMovies: (movies: WatchedMovie[]) => void;
    addMovie: (movie: Movie) => Promise<void>;
    fetchUserMovies: (id: number) => Promise<any[] | undefined>;
    deleteMovie: (id: number) => Promise<void>;
    getMovie: (id: string) => Promise<any>;
    getMovieTimecode: (id: string) => Promise<void>;
    saveCurrentTime: (id: string, current_time: number) => Promise<void>;
    getAllUserMovies: (userId: number) => Promise<any>;
    setError: (error: string | null) => void;
    setLoading: (loading: boolean) => void;
}

export const MovieContext = createContext<MovieContextProps | null>(null);

export const MovieProvider = ({ children }: { children: ReactNode }) => {
    const [movie, setMovie] = useState<Movie | null>(null);
    const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const token = Cookies.get('token');

    const getMovie = async (id: string) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/movies/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.status !== 200) {
                setError('Failed to fetch movie');
                return null;
            }
            setMovie(response.data);
            return response.data;
        } catch (error: any) {
            setError('Failed to fetch movie');
            return null;
        } finally {
            setLoading(false);
        }
    };


    const fetchUserMovies = async (id: number) => {
        const watched = await getAllUserMovies(id)
        if (Array.isArray(watched)) {
          const moviesWithData = await Promise.all(
            watched.map(async (watchedMovie) => {
              const movieData = await getMovie(watchedMovie.movieId);
              return { ...watchedMovie, movie: movieData };
            })
          );
          return moviesWithData;
        } else {
          console.error("Invalid data format received for watched movies:", watched)
        }
    };

    const addMovie = async (movie: Movie) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/library/${movie.id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body : JSON.stringify({
                    watched_timecode: "0",
                    original_timecode: movie.runtime,
                }),
            });
            if (response.status !== 200) {
                setError('Failed to add movie');
                return;
            }
        } catch (error: any) {
            setError('Failed to add movie');
        } finally {
            setLoading(false);
        }
    }

    const getMovieTimecode = async (id: string) => {
        try {
            const response = await fetch(`http://localhost:3000/api/library/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Failed to save current time")
            }
            const data = await response.json()
            setMovie(data.timecode)
        } catch (error) {
            console.error("Error saving current time:", error)
        }
    }


    const saveCurrentTime = async (id:string, current_time: number) => {
        try {
          const response = await fetch(`http://localhost:3000/api/library/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ time: current_time  }),
          })

          if (!response.ok) {
            throw new Error("Failed to save current time")
          }
          return response.json()
        } catch (error) {
          console.error("Error saving current time:", error)
        }
      }

    const getAllUserMovies = async (userId: number) => {
        try {
            const response = await fetch(`http://localhost:3000/api/library/user/${userId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                return []
            }
            const data = await response.json()
            return data;
        } catch (error) {
            console.error("Error saving current time:", error)
        }
    }

    const deleteMovie = async (id: number) => {
        try {
            const response = await fetch(`http://localhost:3000/api/movies/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Failed to delete movie")
            }
            return response.json()
        } catch (error) {
            console.error("Error deleting movie:", error)
        }
    }


    return (
        <MovieContext.Provider value={{ movie, loading, error, getMovie, addMovie, fetchUserMovies, deleteMovie, watchedMovies, setWatchedMovies ,saveCurrentTime, getMovieTimecode, setError, getAllUserMovies, setLoading }}>
            {children}
        </MovieContext.Provider>
    );
}

export const useMovieContext = () => {
    const context = useContext(MovieContext);
    if (!context) {
        throw new Error('useMovieContext must be used within a MovieProvider');
    }
    return context;
}