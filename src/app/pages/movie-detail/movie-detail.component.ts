// src/app/pages/movie-detail/movie-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TmdbService } from '../../services/tmdb.service';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { MovieReview } from '../../models/review.model';

@Component({
  standalone: true,
  selector: 'app-movie-detail',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSliderModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.scss']
})
export class MovieDetailComponent implements OnInit, OnDestroy {
  // Propiedades
  movie: Movie | null = null;
  reviews: MovieReview[] = [];
  averageRating = 0;
  isSaved = false;
  loading = true;
  hoverRating = 0;
  trailerKey: string | null = null;
  trailerLoading = false;
  trailerError = false;
  trailerUrl: SafeResourceUrl | null = null; // NUEVO: Cachear la URL
  
  userReview: MovieReview | null = null;
  isEditingReview = false;

  reviewForm = new FormGroup({
    rating: new FormControl(5, [Validators.required, Validators.min(1), Validators.max(10)]),
    review: new FormControl('', [Validators.required, Validators.minLength(10)])
  });

  constructor(
    private route: ActivatedRoute,
    private tmdb: TmdbService,
    private firebase: FirebaseService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadMovie(+id);
      this.loadReviews(+id);
      this.checkIfSaved(+id);
      this.loadUserReview(+id);
      this.loadTrailer(+id);
    }
  }

  ngOnDestroy(): void {
    // Limpiar recursos
    this.trailerUrl = null;
  }

  private loadMovie(id: number): void {
    this.tmdb.getMovieDetails(id).subscribe({
      next: (movie) => {
        this.movie = movie;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('Error al cargar la película');
      }
    });
  }

  private loadReviews(movieId: number): void {
    this.firebase.getReviewsForMovie(movieId).subscribe({
      next: (reviews) => {
        this.reviews = reviews;
        this.calculateAverage();
      }
    });
  }

  private checkIfSaved(movieId: number): void {
    this.firebase.isMovieSaved(movieId).subscribe({
      next: (saved) => this.isSaved = saved
    });
  }

  private loadUserReview(movieId: number): void {
    this.firebase.getUserReviewForMovie(movieId).subscribe({
      next: (review) => {
        this.userReview = review;
      }
    });
  }

  private loadTrailer(movieId: number): void {
    console.log('🔍 Cargando trailer para película:', movieId);
    this.trailerLoading = true;
    this.trailerError = false;
    this.trailerUrl = null; // Resetear URL
    
    this.tmdb.getTrailerKey(movieId).subscribe({
      next: (key) => {
        console.log('🎬 Trailer key recibida:', key);
        this.trailerKey = key;
        this.trailerLoading = false;
        
        // Generar la URL UNA sola vez
        if (key) {
          this.generateTrailerUrl(key);
        }
      },
      error: (err) => {
        console.error('❌ Error al cargar trailer:', err);
        this.trailerKey = null;
        this.trailerUrl = null;
        this.trailerLoading = false;
        this.trailerError = true;
      }
    });
  }

  // NUEVO: Generar la URL una sola vez
  private generateTrailerUrl(key: string): void {
    const embedUrl = `https://www.youtube.com/embed/${key}?autoplay=0&mute=0&rel=0&modestbranding=1&enablejsapi=1`;
    console.log('🎬 URL generada UNA VEZ:', embedUrl);
    this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // MODIFICADO: Ahora solo retorna la URL cacheada
  getTrailerUrl(): SafeResourceUrl | null {
    return this.trailerUrl;
  }

  onTrailerLoad(): void {
    console.log('✅ Trailer cargado exitosamente');
  }

  playTrailer(): void {
    if (!this.trailerKey) return;
    
    console.log('▶️ Reproduciendo trailer manualmente');
    
    // En lugar de recargar el iframe, usamos una URL con autoplay
    const embedUrl = `https://www.youtube.com/embed/${this.trailerKey}?autoplay=1&mute=0&rel=0&modestbranding=1`;
    this.trailerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    
    // Restaurar la URL original después de un tiempo
    setTimeout(() => {
      this.generateTrailerUrl(this.trailerKey!);
    }, 5000);
  }

  private calculateAverage(): void {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    const sum = this.reviews.reduce((acc, r) => acc + r.rating, 0);
    this.averageRating = Math.round((sum / this.reviews.length) * 10) / 10;
  }

  toggleSave(): void {
    if (!this.movie) return;

    if (this.isSaved) {
      this.firebase.removeSavedMovie(this.movie.id).subscribe({
        next: () => {
          this.isSaved = false;
          this.showMessage('Película eliminada de guardados');
        }
      });
    } else {
      const savedMovie = {
        movieId: this.movie.id,
        movieTitle: this.movie.title,
        moviePoster: this.movie.poster_path || '',
        overview: this.movie.overview || '',
        releaseDate: this.movie.release_date || '',
        voteAverage: this.movie.vote_average || 0,
        savedAt: new Date()
      };

      this.firebase.saveMovie(savedMovie).subscribe({
        next: () => {
          this.isSaved = true;
          this.showMessage('Película guardada');
        }
      });
    }
  }

  submitReview(): void {
    if (this.reviewForm.invalid || !this.movie) return;

    const userName = this.authService.getUserName();

    if (this.userReview && this.userReview.id) {
      this.firebase.updateReview(
        this.userReview.id,
        this.reviewForm.value.rating!,
        this.reviewForm.value.review!
      ).subscribe({
        next: () => {
          this.showMessage('Reseña actualizada');
          this.isEditingReview = false;
          this.reviewForm.reset({ rating: 5, review: '' });
          this.loadReviews(this.movie!.id);
          this.loadUserReview(this.movie!.id);
        },
        error: () => {
          this.showMessage('Error al actualizar reseña');
        }
      });
    } else {
      const review: MovieReview = {
        movieId: this.movie.id,
        movieTitle: this.movie.title,
        moviePoster: this.movie.poster_path || '',
        rating: this.reviewForm.value.rating!,
        review: this.reviewForm.value.review!,
        userName: userName,
        createdAt: new Date()
      };

      this.firebase.addReview(review).subscribe({
        next: () => {
          this.showMessage('Reseña agregada');
          this.reviewForm.reset({ rating: 5, review: '' });
          this.loadReviews(this.movie!.id);
          this.loadUserReview(this.movie!.id);
        },
        error: () => {
          this.showMessage('Error al agregar reseña');
        }
      });
    }
  }

  startEditReview(): void {
    if (!this.userReview) return;
    
    this.isEditingReview = true;
    this.reviewForm.patchValue({
      rating: this.userReview.rating,
      review: this.userReview.review
    });
    
    setTimeout(() => {
      document.querySelector('.review-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }

  cancelEdit(): void {
    this.isEditingReview = false;
    this.reviewForm.reset({ rating: 5, review: '' });
  }

  deleteReview(reviewId: string): void {
    if (!confirm('¿Eliminar esta reseña?')) return;
    
    this.firebase.deleteReview(reviewId).subscribe({
      next: () => {
        this.showMessage('Reseña eliminada');
        this.userReview = null;
        this.isEditingReview = false;
        this.reviewForm.reset({ rating: 5, review: '' });
        this.loadReviews(this.movie!.id);
      },
      error: () => {
        this.showMessage('Error al eliminar reseña');
      }
    });
  }

  setRating(rating: number): void {
    this.reviewForm.patchValue({ rating });
  }

  getInitial(userName?: string): string {
    return userName?.charAt(0).toUpperCase() || 'A';
  }

  isMyReview(review: MovieReview): boolean {
    const currentUserId = this.authService.getUserId();
    return review.userId === currentUserId;
  }

  getStars(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 10 - fullStars - halfStar;
    
    return [
      ...Array(fullStars).fill('star'),
      ...Array(halfStar).fill('star_half'),
      ...Array(emptyStars).fill('star_border')
    ];
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}