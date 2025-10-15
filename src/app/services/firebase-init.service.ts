// src/app/services/firebase-init.service.ts
import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FirebaseInitService {
  private app: FirebaseApp;
  public db: Firestore;
  public auth: Auth;

  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(this.app);
    this.auth = getAuth(this.app);
  }
}