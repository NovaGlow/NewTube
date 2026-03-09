import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Video, VideoService } from '../../services/video.service';

@Component({
  selector: 'app-video-card',
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss'],
})
export class VideoCardComponent implements OnInit {
  @Input() video!: Video;
  @Output() toggleSave = new EventEmitter<Video>();

  formattedDuration = '';
  formattedViews = '';
  timeAgo = '';

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.formattedDuration = this.videoService.formatDuration(this.video.duration);
    this.formattedViews = this.videoService.formatViews(this.video.viewCount);
    this.timeAgo = this.getTimeAgo(this.video.publishedAt);
  }

  openVideo(): void {
    window.open(`https://www.youtube.com/watch?v=${this.video.id}`, '_blank', 'noopener');
  }

  onToggleSave(event: Event): void {
    event.stopPropagation();
    this.toggleSave.emit(this.video);
  }

  private getTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  }
}
