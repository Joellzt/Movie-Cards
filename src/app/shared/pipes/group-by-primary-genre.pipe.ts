import { Pipe, PipeTransform } from '@angular/core';
import { Movie } from '../../models/movie.model';

@Pipe({ name: 'groupByPrimaryGenre', standalone: true })
export class GroupByPrimaryGenrePipe implements PipeTransform {
  transform(list: Movie[]): { name:string; movies:Movie[] }[] {
    const buckets = new Map<string, Movie[]>();
    for (const m of list || []) {
      const primary = m.genreNames?.[0] ?? 'Sin género';
      const arr = buckets.get(primary) ?? [];
      arr.push(m); buckets.set(primary, arr);
    }
    return Array.from(buckets, ([name, movies]) => ({
      name, movies: movies.sort((a,b)=> b.popularity - a.popularity)
    })).sort((a,b)=> a.name.localeCompare(b.name));
  }
}
