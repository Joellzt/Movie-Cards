// src/app/models/review.model.ts
export interface MovieReview {
  id?: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  rating: number; // 1-10
  review: string;
  createdAt: Date;
  updatedAt?: Date;
  userId?: string;
   userName?: string;
}

export interface SavedMovie {
  id?: string;
  movieId: number;
  movieTitle: string;
  moviePoster: string;
  overview: string;
  releaseDate: string;
  voteAverage: number;
  savedAt: Date;
  userId?: string;
}