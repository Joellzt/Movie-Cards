// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { FirebaseInitService } from './firebase-init.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private firebaseInit: FirebaseInitService) {
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(this.firebaseInit.auth, (user) => {
      console.log('👤 Auth state changed:', user);
      this.currentUserSubject.next(user);
    });
  }

  // Obtener usuario actual
  get currentUser(): User | null {
    return this.firebaseInit.auth.currentUser;
  }

  // Verificar si está autenticado
  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // Obtener nombre del usuario
  getUserName(): string {
    const user = this.currentUser;
    return user?.displayName || user?.email?.split('@')[0] || 'Usuario';
  }

  // Obtener ID del usuario
  getUserId(): string | undefined {
    return this.currentUser?.uid;
  }

  // Obtener email del usuario
  getUserEmail(): string | undefined {
    return this.currentUser?.email || undefined;
  }

  // Registro con email y contraseña
  async register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const credential = await createUserWithEmailAndPassword(
        this.firebaseInit.auth,
        email,
        password
      );
      
      // Actualizar el nombre del usuario
      if (credential.user) {
        await updateProfile(credential.user, { displayName });
      }
      
      return credential.user;
    } catch (error: any) {
      console.error('Error en registro:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login con email y contraseña
  async login(email: string, password: string): Promise<User> {
    try {
      const credential = await signInWithEmailAndPassword(
        this.firebaseInit.auth,
        email,
        password
      );
      return credential.user;
    } catch (error: any) {
      console.error('Error en login:', error);
      throw this.handleAuthError(error);
    }
  }

  // Login con Google (Actualizado para manejar popup cerrado)
  async loginWithGoogle(): Promise<User | null> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const credential = await signInWithPopup(this.firebaseInit.auth, provider);
      return credential.user;
    } catch (error: any) {
      // Si el usuario cerró el popup, no es un error real
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('ℹ️ Usuario cerró la ventana de login');
        return null; // Retornar null en lugar de lanzar error
      }
      
      // Si el usuario canceló el login
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('ℹ️ Login cancelado');
        return null;
      }
      
      console.error('Error en login con Google:', error);
      throw this.handleAuthError(error);
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseInit.auth);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  // Manejo de errores (Actualizado)
  private handleAuthError(error: any): Error {
    let message = 'Error de autenticación';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Este correo ya está registrado';
        break;
      case 'auth/invalid-email':
        message = 'Correo electrónico inválido';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operación no permitida';
        break;
      case 'auth/weak-password':
        message = 'La contraseña debe tener al menos 6 caracteres';
        break;
      case 'auth/user-disabled':
        message = 'Usuario deshabilitado';
        break;
      case 'auth/user-not-found':
        message = 'Usuario no encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Contraseña incorrecta';
        break;
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        message = 'Login cancelado por el usuario';
        break;
      case 'auth/network-request-failed':
        message = 'Error de conexión. Verifica tu internet';
        break;
      case 'auth/too-many-requests':
        message = 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        message = error.message || 'Error desconocido';
    }
    
    return new Error(message);
  }
}