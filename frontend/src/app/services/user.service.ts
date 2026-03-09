import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateProfile(data: { username?: string; bio?: string; avatarUrl?: string }): Observable<any> {
    return this.http.patch(`${this.apiUrl}/profile`, data);
  }

  getPreferences(): Observable<any> {
    return this.http.get(`${this.apiUrl}/preferences`);
  }

  addPreference(data: { categoryName: string; categoryId: string; interestLevel?: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/preferences`, data);
  }

  removePreference(categoryName: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/preferences/${encodeURIComponent(categoryName)}`);
  }
}
