// src/app/shared/components/trailer-dialog/trailer-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-trailer-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './trailer-dialog.component.html',
  styleUrls: ['./trailer-dialog.component.scss']
})
export class TrailerDialogComponent {
  videoUrl: SafeResourceUrl;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { youtubeKey: string },
    private dialogRef: MatDialogRef<TrailerDialogComponent>,
    private sanitizer: DomSanitizer
  ) {
    const embedUrl = `https://www.youtube.com/embed/${data.youtubeKey}?autoplay=1`;
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  close(): void {
    this.dialogRef.close();
  }
}