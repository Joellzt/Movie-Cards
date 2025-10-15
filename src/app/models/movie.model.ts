// src/app/models/movie.model.ts
export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  vote_average: number;
  popularity: number;
  runtime?: number;
  budget?: number;
  revenue?: number;
  production_companies?: ProductionCompany[];
  credits?: Credits;
  videos?: VideoResponse; // ← AGREGAR ESTA LÍNEA
  
  // Campos para géneros
  genre_ids?: number[];
  genres?: Genre[];
  genreNames?: string[];
  source?: 'tmdb';
}

export interface Genre {
  id: number;
  name: string;
}

export interface TmdbGenreResponse {
  genres: Genre[];
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbPaged<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}
// ========== INTERFACES PARA VIDEOS ==========
export interface VideoResponse {
  id: number;
  results: Video[];
}

export interface Video {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;         // ← YouTube key
  name: string;
  site: string;        // ← "YouTube"
  size: number;
  type: string;        // ← "Trailer", "Teaser", etc.
  official: boolean;
  published_at: string;
}