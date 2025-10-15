// src/app/services/firebase.service.ts
import { Injectable } from '@angular/core';
import { 
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import { Observable, from, map, tap } from 'rxjs';
import { FirebaseInitService } from './firebase-init.service';
import { AuthService } from './auth.service'; // ← AGREGA
import { MovieReview, SavedMovie } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  private savedMoviesCollection = 'savedMovies';
  private reviewsCollection = 'movieReviews';

  constructor(
    private firebaseInit: FirebaseInitService,
    private authService: AuthService // ← AGREGA
  ) {}

  // ========== PELÍCULAS GUARDADAS ==========

  saveMovie(movie: SavedMovie): Observable<string> {
    const userId = this.authService.getUserId(); // ← AGREGA
    const movieData = {
      ...movie,
      userId, // ← AGREGA userId
      savedAt: Timestamp.fromDate(new Date())
    };
    
    const moviesRef = collection(this.firebaseInit.db, this.savedMoviesCollection);
    return from(addDoc(moviesRef, movieData)).pipe(
      map(docRef => docRef.id)
    );
  }

  getSavedMovies(): Observable<SavedMovie[]> {
    const userId = this.authService.getUserId(); // ← AGREGA
    if (!userId) return from([[]]).pipe(map(() => [])); // ← AGREGA validación
    
    const moviesRef = collection(this.firebaseInit.db, this.savedMoviesCollection);
    const q = query(
      moviesRef,
      where('userId', '==', userId), // ← AGREGA filtro por usuario
      orderBy('savedAt', 'desc')
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(document => ({
          id: document.id,
          ...document.data(),
          savedAt: (document.data()['savedAt'] as Timestamp).toDate()
        } as SavedMovie));
      })
    );
  }

  isMovieSaved(movieId: number): Observable<boolean> {
    const userId = this.authService.getUserId(); // ← AGREGA
    if (!userId) return from([false]).pipe(map(() => false)); // ← AGREGA validación
    
    const moviesRef = collection(this.firebaseInit.db, this.savedMoviesCollection);
    const q = query(
      moviesRef,
      where('movieId', '==', movieId),
      where('userId', '==', userId) // ← AGREGA filtro por usuario
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => !snapshot.empty)
    );
  }

  removeSavedMovie(movieId: number): Observable<void> {
    const userId = this.authService.getUserId(); // ← AGREGA
    if (!userId) return from([undefined]).pipe(map(() => undefined)); // ← AGREGA validación
    
    const moviesRef = collection(this.firebaseInit.db, this.savedMoviesCollection);
    const q = query(
      moviesRef,
      where('movieId', '==', movieId),
      where('userId', '==', userId) // ← AGREGA filtro por usuario
    );
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        snapshot.docs.forEach(document => {
          deleteDoc(doc(this.firebaseInit.db, this.savedMoviesCollection, document.id));
        });
      })
    );
  }

  // ========== RESEÑAS ==========

  getUserReviewForMovie(movieId: number): Observable<MovieReview | null> {
  const userId = this.authService.getUserId();
  if (!userId) return from([null]).pipe(map(() => null));
  
  console.log('🔍 Firebase: Buscando reseña del usuario para película:', movieId);
  const reviewsRef = collection(this.firebaseInit.db, this.reviewsCollection);
  const q = query(
    reviewsRef,
    where('movieId', '==', movieId),
    where('userId', '==', userId)
  );
  
  return from(getDocs(q)).pipe(
    map(snapshot => {
      if (snapshot.empty) {
        console.log('📝 Usuario no tiene reseña para esta película');
        return null;
      }
      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log('✅ Reseña existente encontrada:', doc.id);
      return {
        id: doc.id,
        ...data,
        createdAt: (data['createdAt'] as Timestamp).toDate(),
        updatedAt: data['updatedAt'] ? (data['updatedAt'] as Timestamp).toDate() : undefined
      } as MovieReview;
    })
  );
}

  addReview(review: MovieReview): Observable<string> {
    console.log('🔥 Firebase: Guardando reseña:', review);
    const userId = this.authService.getUserId(); // ← AGREGA
    const reviewData = {
      ...review,
      userId, // ← AGREGA userId
      createdAt: Timestamp.fromDate(new Date())
    };
    
    const reviewsRef = collection(this.firebaseInit.db, this.reviewsCollection);
    return from(addDoc(reviewsRef, reviewData)).pipe(
      tap(docRef => console.log('✅ Reseña guardada con ID:', docRef.id)),
      map(docRef => docRef.id)
    );
  }

  getReviewsForMovie(movieId: number): Observable<MovieReview[]> {
    console.log('🔍 Firebase: Buscando reseñas para película:', movieId);
    const reviewsRef = collection(this.firebaseInit.db, this.reviewsCollection);
    
    // TODAS las reseñas de la película (de todos los usuarios) ← IMPORTANTE
    const q = query(
      reviewsRef,
      where('movieId', '==', movieId)
    );
    
    return from(getDocs(q)).pipe(
      tap(snapshot => console.log('📦 Reseñas encontradas:', snapshot.docs.length)),
      map(snapshot => {
        const reviews = snapshot.docs.map(document => {
          const data = document.data();
          console.log('📄 Documento de reseña:', { id: document.id, ...data });
          return {
            id: document.id,
            ...data,
            createdAt: (data['createdAt'] as Timestamp).toDate(),
            updatedAt: data['updatedAt'] ? (data['updatedAt'] as Timestamp).toDate() : undefined
          } as MovieReview;
        });
        
        // Ordenar en el cliente
        reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        console.log('✨ Reseñas procesadas:', reviews);
        return reviews;
      })
    );
  }

  getAllReviews(): Observable<MovieReview[]> {
    const userId = this.authService.getUserId(); // ← AGREGA
    if (!userId) return from([[]]).pipe(map(() => [])); // ← AGREGA validación
    
    console.log('🔍 Firebase: Obteniendo TODAS las reseñas del usuario');
    const reviewsRef = collection(this.firebaseInit.db, this.reviewsCollection);
    const q = query(
      reviewsRef,
      where('userId', '==', userId), // ← AGREGA filtro por usuario
      orderBy('createdAt', 'desc')
    );
    
    return from(getDocs(q)).pipe(
      tap(snapshot => console.log('📦 Total de reseñas del usuario:', snapshot.docs.length)),
      map(snapshot => {
        return snapshot.docs.map(document => ({
          id: document.id,
          ...document.data(),
          createdAt: (document.data()['createdAt'] as Timestamp).toDate(),
          updatedAt: document.data()['updatedAt'] ? (document.data()['updatedAt'] as Timestamp).toDate() : undefined
        } as MovieReview));
      })
    );
  }

  updateReview(reviewId: string, rating: number, reviewText: string): Observable<void> {
    console.log('✏️ Firebase: Actualizando reseña:', reviewId);
    const reviewRef = doc(this.firebaseInit.db, this.reviewsCollection, reviewId);
    return from(updateDoc(reviewRef, {
      rating,
      review: reviewText,
      updatedAt: Timestamp.fromDate(new Date())
    })).pipe(
      tap(() => console.log('✅ Reseña actualizada'))
    );
  }

  deleteReview(reviewId: string): Observable<void> {
    console.log('🗑️ Firebase: Eliminando reseña:', reviewId);
    const reviewRef = doc(this.firebaseInit.db, this.reviewsCollection, reviewId);
    return from(deleteDoc(reviewRef)).pipe(
      tap(() => console.log('✅ Reseña eliminada'))
    );
  }

  getAverageRating(movieId: number): Observable<number> {
    return this.getReviewsForMovie(movieId).pipe(
      map(reviews => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / reviews.length) * 10) / 10;
      })
    );
  }
}