import { Component, OnInit } from '@angular/core';
import { Video, VideoService, Category } from '../../services/video.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-video-browser',
  templateUrl: './video-browser.component.html',
  styleUrls: ['./video-browser.component.scss'],
})
export class VideoBrowserComponent implements OnInit {
  videos: Video[] = [];
  categories: Category[] = [];
  loading = false;
  loadingMore = false;
  error = '';

  selectedCategory = '';
  selectedRegion = '';
  searchQuery = '';
  mode: 'discover' | 'search' = 'discover';

  nextPageToken: string | null = null;
  regionUsed = '';
  categoryUsed = '';

  surpriseVideo: Video | null = null;
  surpriseLoading = false;

  private searchSubject = new Subject<string>();

  readonly REGIONS = [
    { code: 'US', name: '🇺🇸 United States' },
    { code: 'GB', name: '🇬🇧 United Kingdom' },
    { code: 'JP', name: '🇯🇵 Japan' },
    { code: 'BR', name: '🇧🇷 Brazil' },
    { code: 'IN', name: '🇮🇳 India' },
    { code: 'KR', name: '🇰🇷 South Korea' },
    { code: 'FR', name: '🇫🇷 France' },
    { code: 'DE', name: '🇩🇪 Germany' },
    { code: 'AU', name: '🇦🇺 Australia' },
    { code: 'MX', name: '🇲🇽 Mexico' },
    { code: 'NG', name: '🇳🇬 Nigeria' },
    { code: 'ZA', name: '🇿🇦 South Africa' },
  ];

  constructor(private videoService: VideoService) {}

  ngOnInit(): void {
    this.videoService.getCategories().subscribe(res => {
      this.categories = res.categories;
    });

    this.discover();

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(q => {
      if (q.trim().length > 1) {
        this.mode = 'search';
        this.videos = [];
        this.nextPageToken = null;
        this.runSearch(q);
      } else if (q.trim().length === 0) {
        this.mode = 'discover';
        this.discover();
      }
    });
  }

  discover(): void {
    this.loading = true;
    this.error = '';
    this.mode = 'discover';
    this.nextPageToken = null;

    this.videoService.discover({
      categoryId: this.selectedCategory || undefined,
      region: this.selectedRegion || undefined,
    }).subscribe({
      next: (res) => {
        this.videos = res.videos;
        this.nextPageToken = res.nextPageToken;
        this.regionUsed = res.regionUsed;
        this.categoryUsed = res.categoryUsed;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load videos. Check your API key in the backend .env file.';
        this.loading = false;
      },
    });
  }

  loadMore(): void {
    if (!this.nextPageToken || this.loadingMore) return;

    this.loadingMore = true;

    const obs = this.mode === 'search'
      ? this.videoService.search(this.searchQuery, { pageToken: this.nextPageToken })
      : this.videoService.discover({ categoryId: this.selectedCategory, region: this.selectedRegion, pageToken: this.nextPageToken });

    obs.subscribe({
      next: (res: any) => {
        this.videos = [...this.videos, ...res.videos];
        this.nextPageToken = res.nextPageToken;
        this.loadingMore = false;
      },
      error: () => { this.loadingMore = false; },
    });
  }

  onSearchInput(q: string): void {
    this.searchSubject.next(q);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.mode = 'discover';
    this.discover();
  }

  private runSearch(q: string): void {
    this.loading = true;

    this.videoService.search(q).subscribe({
      next: (res) => {
        this.videos = res.videos;
        this.nextPageToken = res.nextPageToken;
        this.loading = false;
      },
      error: () => {
        this.error = 'Search failed. Please try again.';
        this.loading = false;
      },
    });
  }

  surprise(): void {
    this.surpriseLoading = true;
    this.surpriseVideo = null;

    this.videoService.surprise().subscribe({
      next: (res) => {
        this.surpriseVideo = res.video as any;
        this.surpriseLoading = false;
      },
      error: () => { this.surpriseLoading = false; },
    });
  }

  openSurprise(): void {
    if (this.surpriseVideo) {
      window.open(`https://www.youtube.com/watch?v=${this.surpriseVideo.id}`, '_blank', 'noopener');
    }
  }

  closeSurprise(): void {
    this.surpriseVideo = null;
  }

  onToggleSave(video: Video): void {
    if (video.isSaved) {
      this.videoService.unsaveVideo(video.id).subscribe(() => {
        video.isSaved = false;
      });
    } else {
      this.videoService.saveVideo(video).subscribe(() => {
        video.isSaved = true;
      });
    }
  }

  getCategoryName(id: string): string {
    return this.categories.find(c => c.id === id)?.name || id;
  }

  get skeletons() {
    return Array(12).fill(0);
  }
}
