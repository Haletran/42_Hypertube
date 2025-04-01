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
}

export interface MovieCardProps {
    movies: Movie[];
    observerRef: React.RefObject<null>;
    loadState: boolean;
}

export interface MovieGridProps {
    onMovieSelect?: (movie: Movie) => void;
}

export interface Torrent {
  id: string;
  name: string;
  seeders: number;
  leechers: number;
  size: string;
  info_hash: string;
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
}


export interface Comment {
    id: number;
    author: string;
    content: string;
    date: string;
}

export interface User {
    id: number;
    email: string;
}
  
  
  export interface LoginResponse {
    token: string;
  }
  
  
  export interface RegisterResponse {
    id: number;
    email: string;
  
  }