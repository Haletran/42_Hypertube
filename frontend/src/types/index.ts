export interface Movie {
    id: number;
    imdb_id: string;
    title: string;
    tagline: string;
    overview: string;
    poster_path: string;
    vote_average: number;
    release_date: string
    isAvailable: boolean;
    runtime: number;
    genres?: { id: number; name: string }[]
    production_companies?: { id: number; name: string }[]
    watched_timecode: string | null;
    user_id: number | null;
}

export interface MovieCardProps {
    movies: Movie[];
    observerRef: React.RefObject<null>;
    loadState: boolean;
    language: string;
}

export interface MovieGridProps {
    onMovieSelect?: (movie: Movie) => void;
    language: string;
}

export interface Torrent {
    id: number
    name: string
    seeders: number
    leechers: number
    size: string
    info_hash: string
    quality?: string
    language?: string
    provider?: string
}

export interface LoginUser {
    params: {
        email: string;
        password: string;
    }
}

export interface RegisterUser {
    params: {
        username: string;
        email: string;
        password: string;
    }
}

export interface WatchMovieParams {
    params: {
        id: number;
    };
    request: {
        language: string;
    }
}

export interface User {
    user: {
        id: number;
        username: string;
        email: string;
        profilePicture: string;
        language: string;
        createdAt: string;
        role: string;
    }
}


export interface UserProfile {
    id: number;
    username: string;
    profile_picture: string;
    language: string;
    created_at: string;
}


export interface LoginResponse {
    token: string;
}


export interface RegisterResponse {
    id: number;
    email: string;

}


export interface Comment {
    id: string;
    content: string;
    movieId: string;
    userId: number;
    updated_at: string;
    user: User;
}

export interface WatchedMovie {
    id: number
    title: string
    userId: number
    movieId: number
    watchedTimecode: string
    originalTimecode: number
    movie: Movie
    language: string
  }