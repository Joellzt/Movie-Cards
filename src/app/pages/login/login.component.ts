// src/app/pages/login/login.component.ts
import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../services/auth.service';
import { TmdbHeroService } from '../../services/tmdb-hero.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  isRegisterMode = false;
  loading = false;
  hidePassword = true;

  // Signals para el carrusel de fondo
  aUrl = signal<string>('');
  bUrl = signal<string>('');
  showA = signal<boolean>(true);

  private imgs: string[] = [];
  private timer?: any;
  private idx = 0;

  loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
    displayName: new FormControl('')
  });

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private hero: TmdbHeroService
  ) {
    // Si ya está autenticado, redirigir
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/home']);
    }
  }

  ngOnInit(): void {
    // cargar imágenes y arrancar el carrusel
    this.hero.getHeroBackdrops(12).subscribe((list) => {
      this.imgs = list.map((x) => x.url);
      this.preloadAll(this.imgs);
      if (this.imgs.length) {
        this.aUrl.set(this.imgs[0]);
        this.bUrl.set(this.imgs[1 % this.imgs.length]);
        this.startCycle();
      }
    });
  }

  toggleMode(): void {
    this.isRegisterMode = !this.isRegisterMode;
    this.loginForm.reset();

    if (this.isRegisterMode) {
      this.loginForm.get('displayName')?.setValidators([Validators.required]);
    } else {
      this.loginForm.get('displayName')?.clearValidators();
    }
    this.loginForm.get('displayName')?.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password, displayName } = this.loginForm.value;

    try {
      if (this.isRegisterMode) {
        await this.authService.register(email!, password!, displayName!);
        this.showMessage('¡Cuenta creada! Bienvenido');
      } else {
        await this.authService.login(email!, password!);
        this.showMessage('¡Bienvenido de vuelta!');
      }
      this.router.navigate(['/home']);
    } catch (error: any) {
      this.showMessage(error.message);
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.loading = true;
    try {
      await this.authService.loginWithGoogle();
      this.showMessage('¡Bienvenido!');
      this.router.navigate(['/home']);
    } catch (error: any) {
      if (error.message !== 'Ventana de login cerrada') {
        this.showMessage(error.message);
      }
    } finally {
      this.loading = false;
    }
  }

  private showMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 4000 });
  }

  bgCss = (url: string) => (url ? `url('${url}')` : 'none');

  private startCycle(intervalMs = 6000) {
    this.stopCycle();
    this.timer = setInterval(() => {
      this.idx = (this.idx + 1) % this.imgs.length;
      const next = this.imgs[this.idx];

      // alternar capas para hacer cross-fade
      if (this.showA()) {
        this.bUrl.set(next);
        this.showA.set(false); // aparece B
      } else {
        this.aUrl.set(next);
        this.showA.set(true); // aparece A
      }
    }, intervalMs);
  }

  private stopCycle() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private preloadAll(urls: string[]) {
    urls.forEach((u) => {
      const img = new Image();
      img.src = u;
    });
  }
  
  ngOnDestroy(): void { 
    this.stopCycle(); 
  }
}