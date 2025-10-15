// src/environments/environment.ts
import { initializeApp } from 'firebase/app';

export const environment = {
  production: false,
  tmdb: {
    apiBase: 'https://api.themoviedb.org/3',
    imageBase: 'https://image.tmdb.org/t/p/w500',
    imageBackdropBase: 'https://image.tmdb.org/t/p/w1280',
    apiKey: '3b74654a3c4a70607cc4e35aad5bc981',
  },
  firebaseConfig: {
    apiKey: 'AIzaSyCBMlirn4aZ_U4bTWw2gRdnYBKl0V9wfeE',
    authDomain: 'movies-app-11ea9.firebaseapp.com',
    projectId: 'movies-app-11ea9',
    storageBucket: 'movies-app-11ea9.firebasestorage.app',
    messagingSenderId: '26490749561',
    appId: '1:26490749561:web:f74e08453037ab85b8caa8',
  },
};

export const app = initializeApp(environment.firebaseConfig);
