// src/app/pages/my-reviews/my-reviews.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { MovieReview } from '../../models/review.model';

@Component({
  standalone: true,
  selector: 'app-my-reviews',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss']
})
export class MyReviewsComponent implements OnInit {
  reviews: MovieReview[] = [];
  loading = true;
  editingReviewId: string | null = null;
  hoverRating = 0;

  editForm = new FormGroup({
    rating: new FormControl(5, [Validators.required, Validators.min(1), Validators.max(10)]),
    review: new FormControl('', [Validators.required, Validators.minLength(10)])
  });

  constructor(
    private firebase: FirebaseService,
    private authService: AuthService,
    private location: Location,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🔍 MyReviews: Cargando reseñas del usuario:', this.authService.getUserId());
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.firebase.getAllReviews().subscribe({
      next: (reviews) => {
        console.log('✅ MyReviews: Reseñas cargadas:', reviews);
        this.reviews = reviews;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ MyReviews: Error al cargar reseñas:', error);
        this.loading = false;
        
        // Si el error es por falta de índice, mostrar mensaje específico
        if (error.message?.includes('index')) {
          this.showMessage('Creando índice en Firebase... Por favor recarga en 1-2 minutos');
        } else {
          this.showMessage('Error al cargar reseñas');
        }
      }
    });
  }

  startEdit(review: MovieReview): void {
    this.editingReviewId = review.id!;
    this.editForm.patchValue({
      rating: review.rating,
      review: review.review
    });
  }

  cancelEdit(): void {
    this.editingReviewId = null;
    this.editForm.reset({ rating: 5, review: '' });
    this.hoverRating = 0;
  }

  saveEdit(reviewId: string): void {
    if (this.editForm.invalid) return;

    this.firebase.updateReview(
      reviewId,
      this.editForm.value.rating!,
      this.editForm.value.review!
    ).subscribe({
      next: () => {
        this.showMessage('Reseña actualizada');
        this.editingReviewId = null;
        this.loadReviews();
      },
      error: () => {
        this.showMessage('Error al actualizar reseña');
      }
    });
  }

  deleteReview(reviewId: string): void {
    if (!confirm('¿Estás seguro de eliminar esta reseña?')) return;
    
    this.firebase.deleteReview(reviewId).subscribe({
      next: () => {
        this.reviews = this.reviews.filter(r => r.id !== reviewId);
        this.showMessage('Reseña eliminada');
      },
      error: () => {
        this.showMessage('Error al eliminar reseña');
      }
    });
  }

  setRating(rating: number): void {
    this.editForm.patchValue({ rating });
  }

  goBack(): void {
    this.location.back();
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

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3000 });
  }
}
