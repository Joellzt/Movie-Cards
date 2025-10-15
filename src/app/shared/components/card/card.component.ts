// src/app/shared/components/card/card.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { trigger, transition, style, animate } from '@angular/animations';

import { Movie } from '../../../models/movie.model';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  standalone: true,
  selector: 'app-movie-card',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class CardComponent implements OnInit {
  @Input() movie!: Movie;
  
  isExpanded = false;
  isSaved = false;

  constructor(
    private router: Router,
    private firebase: FirebaseService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkIfSaved();
  }

  toggleExpand(event: Event): void {
    event.stopPropagation();
    this.isExpanded = !this.isExpanded;
  }

  goToDetail(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/movie', this.movie.id]);
  }

  toggleSave(event: Event): void {
    event.stopPropagation();

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

  private checkIfSaved(): void {
    this.firebase.isMovieSaved(this.movie.id).subscribe({
      next: (saved) => {
        this.isSaved = saved;
      }
    });
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 2000 });
  }
}