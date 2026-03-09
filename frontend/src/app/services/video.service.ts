import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Video {
  id: string;
  title: string;
  description: string;
  channelName: string;
  channelId: string;
  thumbnail: string;
  publishedAt: string;
  duration: string;
  viewCount: number;
  likeCount: number;
  commentCount?: number;
  categoryId?: string;
  tags?: string[];
  isSaved: boolean;
}

export interface DiscoverResponse {
  videos: Video[];
  nextPageToken: string | null;
  prevPageToken: string | null;
  totalResults: number;
  regionUsed: string;
  categoryUsed: string;
}

export interface SearchResponse {
  videos: Video[];
  nextPageToken: string | null;
  totalResults: number;
}

export interface Category {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class VideoService {
  private readonly apiUrl = `${environment.apiUrl}/videos`;

  constructor(private http: HttpClient) {}

  getCategories(): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(`${this.apiUrl}/categories`);
  }

  discover(options: {
    categoryId?: string;
    region?: string;
    pageToken?: string;
    maxResults?: number;
  } = {}): Observable<DiscoverResponse> {
    let params = new HttpParams();
    if (options.categoryId) params = params.set('categoryId', options.categoryId);
    if (options.region) params = params.set('region', options.region);
    if (options.pageToken) params = params.set('pageToken', options.pageToken);
    if (options.maxResults) params = params.set('maxResults', options.maxResults.toString());

    return this.http.get<DiscoverResponse>(`${this.apiUrl}/discover`, { params });
  }

  search(q: string, options: { pageToken?: string; maxResults?: number } = {}): Observable<SearchResponse> {
    let params = new HttpParams().set('q', q);
    if (options.pageToken) params = params.set('pageToken', options.pageToken);
    if (options.maxResults) params = params.set('maxResults', options.maxResults.toString());

    return this.http.get<SearchResponse>(`${this.apiUrl}/search`, { params });
  }

  surprise(): Observable<{ video: Video }> {
    return this.http.get<{ video: Video }>(`${this.apiUrl}/surprise`);
  }

  saveVideo(video: Video): Observable<any> {
    return this.http.post(`${this.apiUrl}/save`, {
      youtubeId: video.id,
      title: video.title,
      channelName: video.channelName,
      thumbnailUrl: video.thumbnail,
      duration: video.duration,
      viewCount: video.viewCount,
      publishedAt: video.publishedAt,
    });
  }

  unsaveVideo(youtubeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/save/${youtubeId}`);
  }

  getSavedVideos(): Observable<{ videos: any[] }> {
    return this.http.get<{ videos: any[] }>(`${this.apiUrl}/saved`);
  }

  recordHistory(video: Video): Observable<any> {
    return this.http.post(`${this.apiUrl}/history`, {
      youtubeId: video.id,
      title: video.title,
      channelName: video.channelName,
      thumbnailUrl: video.thumbnail,
    });
  }

  getHistory(limit: number = 20): Observable<{ history: any[] }> {
    return this.http.get<{ history: any[] }>(`${this.apiUrl}/history`, {
      params: new HttpParams().set('limit', limit.toString()),
    });
  }

  // Helper: format ISO 8601 duration (PT4M13S) to human-readable (4:13)
  formatDuration(iso: string): string {
    if (!iso) return '';
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return '';
    const h = parseInt(match[1] || '0');
    const m = parseInt(match[2] || '0');
    const s = parseInt(match[3] || '0');
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Helper: format view count (1234567 → 1.2M)
  formatViews(count: number): string {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
    return count.toString();
  }
}
