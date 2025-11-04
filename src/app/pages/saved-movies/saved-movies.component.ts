// src/app/pages/saved-movies/saved-movies.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CardComponent } from '../../shared/components/card/card.component';

import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { SavedMovie } from '../../models/review.model';
import { Movie } from '../../models/movie.model';

@Component({
  standalone: true,
  selector: 'app-saved-movies',
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    CardComponent  // ← AGREGAR AQUÍ
  ],
  templateUrl: './saved-movies.component.html',
  styleUrls: ['./saved-movies.component.scss']
})
export class SavedMoviesComponent implements OnInit {
  movies: Movie[] = [];  // ← Cambiar de SavedMovie[] a Movie[]
  loading = true;

  constructor(
    private firebase: FirebaseService,
    private authService: AuthService,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🎬 SavedMovies: Iniciando carga...');
    console.log('👤 Usuario actual:', this.authService.getUserId());
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
    this.firebase.getSavedMovies().subscribe({
      next: (savedMovies) => {
        console.log('✅ SavedMovies: Películas cargadas:', savedMovies);
        
        // Transformar SavedMovie a Movie para MovieCardComponent
        this.movies = savedMovies.map(saved => ({
          id: saved.movieId,
          title: saved.movieTitle,
          poster_path: saved.moviePoster,
          overview: saved.overview,
          release_date: saved.releaseDate,
          vote_average: saved.voteAverage,
          backdrop_path: '',
          genre_ids: [],
          original_language: '',
          original_title: saved.movieTitle,
          popularity: 0,
          video: false,
          vote_count: 0,
          adult: false
        }));
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ SavedMovies: Error al cargar películas:', error);
        this.loading = false;
        
        if (error.message?.includes('index')) {
          this.showMessage('Creando índice en Firebase... Por favor recarga en 1-2 minutos');
        } else if (error.message?.includes('permission')) {
          this.showMessage('Error de permisos. Verifica las reglas de Firestore');
        } else {
          this.showMessage('Error al cargar películas guardadas');
        }
      }
    });
  }

  removeMovie(movieId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    
    if (!confirm('¿Eliminar esta película de guardadas?')) return;
    
    this.firebase.removeSavedMovie(movieId).subscribe({
      next: () => {
        console.log('✅ Película eliminada:', movieId);
        this.movies = this.movies.filter(m => m.id !== movieId);  // ← Cambiar m.movieId a m.id
        this.showMessage('Película eliminada');
      },
      error: (error) => {
        console.error('❌ Error al eliminar:', error);
        this.showMessage('Error al eliminar película');
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}