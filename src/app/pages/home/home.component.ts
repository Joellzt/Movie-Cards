// src/app/pages/home/home.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TmdbService } from '../../services/tmdb.service';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebase.service';
import { Movie } from '../../models/movie.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { GroupByPrimaryGenrePipe } from '../../shared/pipes/group-by-primary-genre.pipe';
import { TrailerDialogComponent } from '../../shared/components/trailer-dialog/trailer-dialog.component';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardComponent,
    GroupByPrimaryGenrePipe,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDividerModule,
    MatDialogModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  loading = false;
  movies: Movie[] = [];
  heroMovies: Movie[] = [];
  currentHeroIndex = 0;
  userName = '';
  userEmail = '';
  userAvatar = '';
  isCurrentHeroSaved = false;

  private heroInterval?: number;
  private subscriptions = new Subscription();

  q = new FormControl('', { nonNullable: true });

  constructor(
    private tmdb: TmdbService,
    private authService: AuthService,
    private firebase: FirebaseService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    const user = this.authService.currentUser;
    this.userName = user?.displayName || user?.email?.split('@')[0] || 'Usuario';
    this.userEmail = user?.email || '';
    this.userAvatar = user?.photoURL || '';
  }

  ngOnInit(): void {
    this.fetchPopular();

    const searchSub = this.q.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(text => {
        if (!text.trim()) {
          this.fetchPopular();
          return;
        }
        this.search(text);
      });

    this.subscriptions.add(searchSub);

    // Auto-cambio del hero cada 5 segundos
    this.heroInterval = window.setInterval(() => {
      this.nextHero();
    }, 5000);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.heroInterval) {
      clearInterval(this.heroInterval);
    }
  }

private fetchPopular() {
  this.loading = true;
  
  // Cargar películas en cartelera para el hero
  this.tmdb.nowPlayingMovies().subscribe(heroList => {
    this.heroMovies = heroList.slice(0, 10);
    
    // Cargar películas populares para el grid
    this.tmdb.popularMovies().subscribe(list => {
      this.movies = list;
      this.loading = false;
      this.checkIfHeroSaved();
    });
  });
}

  private search(text: string) {
    this.loading = true;
    this.tmdb.searchMovies(text).subscribe(list => {
      this.movies = list;
      this.heroMovies = [];
      this.loading = false;
    });
  }

  // ========== Hero carousel ==========
  nextHero(): void {
    this.currentHeroIndex = (this.currentHeroIndex + 1) % this.heroMovies.length;
    this.checkIfHeroSaved();
  }

  previousHero(): void {
    this.currentHeroIndex =
      this.currentHeroIndex === 0
        ? this.heroMovies.length - 1
        : this.currentHeroIndex - 1;
    this.checkIfHeroSaved();
  }

  selectHero(index: number): void {
    this.currentHeroIndex = index;
    this.checkIfHeroSaved();
  }

  get currentHero(): Movie | null {
    return this.heroMovies[this.currentHeroIndex] || null;
  }

  // ========== Verificar si el hero actual está guardado ==========
  private checkIfHeroSaved(): void {
    if (!this.currentHero) {
      this.isCurrentHeroSaved = false;
      return;
    }

    this.firebase.isMovieSaved(this.currentHero.id).subscribe({
      next: (saved) => {
        this.isCurrentHeroSaved = saved;
        console.log('🔖 Película guardada:', saved ? 'Sí' : 'No');
      },
      error: (error) => {
        console.error('❌ Error al verificar película guardada:', error);
        this.isCurrentHeroSaved = false;
      }
    });
  }

  // ========== Abrir trailer en modal ==========
  openTrailer(): void {
    if (!this.currentHero) return;

    this.tmdb.getTrailerKey(this.currentHero.id).subscribe({
      next: (youtubeKey) => {
        if (youtubeKey) {
          this.dialog.open(TrailerDialogComponent, {
            data: { youtubeKey },
            width: '90vw',
            maxWidth: '1200px',
            panelClass: 'trailer-dialog-container',
            backdropClass: 'trailer-backdrop'
          });
        } else {
          this.showMessage('No hay trailer disponible');
        }
      },
      error: () => {
        this.showMessage('Error al cargar el trailer');
      }
    });
  }

  // ========== Toggle guardar/desguardar película desde el hero ==========
  toggleSaveHero(): void {
    if (!this.currentHero) return;

    if (this.isCurrentHeroSaved) {
      this.firebase.removeSavedMovie(this.currentHero.id).subscribe({
        next: () => {
          this.isCurrentHeroSaved = false;
          this.showMessage('Película eliminada de guardados');
        }
      });
    } else {
      const savedMovie = {
        movieId: this.currentHero.id,
        movieTitle: this.currentHero.title,
        moviePoster: this.currentHero.poster_path || '',
        overview: this.currentHero.overview || '',
        releaseDate: this.currentHero.release_date || '',
        voteAverage: this.currentHero.vote_average || 0,
        savedAt: new Date()
      };

      this.firebase.saveMovie(savedMovie).subscribe({
        next: () => {
          this.isCurrentHeroSaved = true;
          this.showMessage('Película guardada');
        }
      });
    }
  }

  // ========== Ver detalles ==========
  viewDetails(movieId: number): void {
    this.router.navigate(['/movie', movieId]);
  }

  // ========== Métodos de usuario ==========
  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.showMessage('Sesión cerrada');
      this.router.navigate(['/login']);
    } catch (error) {
      this.showMessage('Error al cerrar sesión');
    }
  }

  getInitial(): string {
    return this.userName.charAt(0).toUpperCase();
  }

  trackById(index: number, movie: Movie): number {
    return movie.id;
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 2000 });
  }
  showSearch = false;

// Método 1
toggleSearch(): void {
  this.showSearch = !this.showSearch;
}

// Método 2
closeSearch(): void {
  this.showSearch = false;
  this.q.setValue('');
}
}