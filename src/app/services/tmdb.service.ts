// src/app/services/tmdb.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, map, shareReplay, switchMap } from 'rxjs';
import { Movie, TmdbPaged, TmdbGenreResponse, VideoResponse } from '../models/movie.model';

@Injectable({ providedIn: 'root' })
export class TmdbService {
  private api = environment.tmdb.apiBase;
  private key = environment.tmdb.apiKey;
  private img = environment.tmdb.imageBase;

  // cache de géneros (se pide 1 sola vez)
  private genres$?: Observable<Map<number, string>>;

  constructor(private http: HttpClient) { }

  // Helper para crear params
  private params(extra: Record<string, string> = {}) {
    let p = new HttpParams().set('api_key', this.key).set('language', 'es-AR');
    Object.entries(extra).forEach(([k, v]) => (p = p.set(k, v)));
    return p;
  }

  /** Trae /genre/movie/list y lo deja como Map id->name */
  getGenreMap(): Observable<Map<number, string>> {
    if (!this.genres$) {
      this.genres$ = this.http
        .get<TmdbGenreResponse>(`${this.api}/genre/movie/list`, { params: this.params() })
        .pipe(
          map(r => new Map(r.genres.map(g => [g.id, g.name]))),
          shareReplay(1)
        );
    }
    return this.genres$;
  }

  /** Mapea poster completo + genreNames y marca source=tmdb */
  private enrich(list: Movie[], gmap: Map<number, string>): Movie[] {
    return list
      .filter(m => !!m.poster_path)
      .map(m => {
        const genreNames =
          m.genre_ids?.map(id => gmap.get(id)).filter(Boolean) as string[] ||
          m.genres?.map(g => g.name) || [];
        return {
          ...m,
          poster_path: m.poster_path ? `${this.img}${m.poster_path}` : null,
          genreNames,
          source: 'tmdb' as const
        };
      });
  }

  // Películas populares con géneros enriquecidos
  popularMovies(page = 1): Observable<Movie[]> {
    return this.getGenreMap().pipe(
      switchMap(gmap =>
        this.http
          .get<TmdbPaged<Movie>>(`${this.api}/movie/popular`, {
            params: this.params({ page: String(page) })
          })
          .pipe(map(res => this.enrich(res.results, gmap)))
      )
    );
  }

  // Búsqueda de películas con géneros enriquecidos
  searchMovies(query: string, page = 1): Observable<Movie[]> {
    return this.getGenreMap().pipe(
      switchMap(gmap =>
        this.http
          .get<TmdbPaged<Movie>>(`${this.api}/search/movie`, {
            params: this.params({ query, page: String(page), include_adult: 'false' })
          })
          .pipe(map(res => this.enrich(res.results, gmap)))
      )
    );
  }

  // Película por ID (método alternativo, más simple)
  byId(id: number): Observable<Movie | null> {
    return this.getGenreMap().pipe(
      switchMap(gmap =>
        this.http
          .get<Movie>(`${this.api}/movie/${id}`, { params: this.params() })
          .pipe(map(m => this.enrich([m], gmap)[0] ?? null))
      )
    );
  }

  // Detalles completos de película con créditos (para movie-detail)
  getMovieDetails(id: number): Observable<Movie> {
    const params = this.params({ append_to_response: 'credits' });

    return this.http.get<Movie>(`${this.api}/movie/${id}`, { params }).pipe(
      map(movie => ({
        ...movie,
        poster_path: movie.poster_path ? `${this.img}${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
          : null,
        genreNames: movie.genres?.map(g => g.name) || [],
        source: 'tmdb' as const
      }))
    );
  }

  // ========== NUEVOS MÉTODOS PARA VIDEOS/TRAILERS ==========

  /** Obtiene todos los videos de una película */
  getMovieVideos(movieId: number): Observable<VideoResponse> {
    return this.http.get<VideoResponse>(
      `${this.api}/movie/${movieId}/videos`,
      { params: this.params() }
    );
  }

  /** Obtiene el trailer oficial de YouTube (si existe) */
  getOfficialTrailer(movieId: number): Observable<string | null> {
    return this.getMovieVideos(movieId).pipe(
      map(response => {
        const videos = response.results;

        // Buscar trailer oficial en YouTube
        const trailer = videos.find(v =>
          v.site === 'YouTube' &&
          v.type === 'Trailer' &&
          v.official === true
        );

        // Si no hay oficial, buscar cualquier trailer
        const anyTrailer = videos.find(v =>
          v.site === 'YouTube' &&
          v.type === 'Trailer'
        );

        const video = trailer || anyTrailer;

        // Retornar la URL de YouTube
        return video ? `https://www.youtube.com/watch?v=${video.key}` : null;
      })
    );
  }
  getTrailerKey(movieId: number): Observable<string | null> {
    return this.getMovieVideos(movieId).pipe(
      map(response => {
        const videos = response.results;

        // Buscar trailer oficial en YouTube
        const trailer = videos.find(v =>
          v.site === 'YouTube' &&
          v.type === 'Trailer' &&
          v.official === true
        );

        // Si no hay oficial, buscar cualquier trailer
        const anyTrailer = videos.find(v =>
          v.site === 'YouTube' &&
          v.type === 'Trailer'
        );

        const video = trailer || anyTrailer;

        // Retornar solo la key (sin la URL completa)
        return video ? video.key : null;
      })
    );
  }
  nowPlayingMovies(page = 1): Observable<Movie[]> {
    return this.getGenreMap().pipe(
      switchMap(gmap =>
        this.http
          .get<TmdbPaged<Movie>>(`${this.api}/movie/now_playing`, {
            params: this.params({ page: String(page) })
          })
          .pipe(map(res => this.enrich(res.results, gmap)))
      )
    );
  }
}