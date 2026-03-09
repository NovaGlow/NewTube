import { Component, OnInit } from '@angular/core';
import { VideoService } from '../../services/video.service';

@Component({
  selector: 'app-saved-videos',
  templateUrl: './saved-videos.component.html',
  styleUrls: ['./saved-videos.component.scss'],
})
export class SavedVideosComponent implements OnInit {
  videos: any[] = [];
  loading = true;

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.videoService.getSavedVideos().subscribe({
      next: (res) => {
        this.videos = res.videos;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  openVideo(youtubeId: string): void {
    window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank', 'noopener');
  }

  unsave(youtubeId: string): void {
    this.videoService.unsaveVideo(youtubeId).subscribe(() => {
      this.videos = this.videos.filter(v => v.youtube_id !== youtubeId);
    });
  }

  formatViews(count: number): string {
    return this.videoService.formatViews(count);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  get skeletons() { return Array(8).fill(0); }
}
