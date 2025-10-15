// src/app/services/tmdb-hero.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { map, Observable } from 'rxjs';

type TrendingItem = {
  id: number;
  title?: string;
  name?: string;
  backdrop_path: string | null;
  vote_average: number;
  overview: string;
};

@Injectable({ providedIn: 'root' })
export class TmdbHeroService {
  private api = environment.tmdb.apiBase;
  private key = environment.tmdb.apiKey;
  private img = environment.tmdb.imageBackdropBase;

  constructor(private http: HttpClient) {}

  /** Toma trending semanal (pelis/series), filtra backdrops, devuelve top N */
  getHeroBackdrops(limit = 12, lang = 'es-AR'): Observable<{url:string; title:string; avg:number; overview:string}[]> {
    const params = new HttpParams().set('api_key', this.key).set('language', lang);
    return this.http.get<{ results: TrendingItem[] }>(`${this.api}/trending/all/week`, { params })
      .pipe(
        map(res => res.results
          .filter(x => !!x.backdrop_path)
          .sort((a,b) => b.vote_average - a.vote_average) // mejores primero
          .slice(0, limit)
          .map(it => ({
            url: `${this.img}${it.backdrop_path}`,
            title: it.title ?? it.name ?? '—',
            avg: it.vote_average,
            overview: it.overview
          }))
        )
      );
  }
}
