import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { VideoService, Category } from '../../services/video.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profile: any = null;
  stats: any = null;
  preferences: any[] = [];
  categories: Category[] = [];
  loading = true;
  editMode = false;
  saveSuccess = false;

  editForm: FormGroup;

  constructor(
    private userService: UserService,
    private videoService: VideoService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({ username: [''], bio: [''] });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadPreferences();
    this.videoService.getCategories().subscribe(res => {
      this.categories = res.categories;
    });
  }

  loadProfile(): void {
    this.userService.getProfile().subscribe({
      next: (res) => {
        this.profile = res.user;
        this.stats = res.stats;
        this.loading = false;
        this.editForm.patchValue({
          username: res.user.username,
          bio: res.user.bio || '',
        });
      },
    });
  }

  loadPreferences(): void {
    this.userService.getPreferences().subscribe(res => {
      this.preferences = res.preferences;
    });
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    this.saveSuccess = false;
  }

  saveProfile(): void {
    this.userService.updateProfile(this.editForm.value).subscribe({
      next: (res) => {
        this.profile = { ...this.profile, ...res.user };
        this.editMode = false;
        this.saveSuccess = true;
        setTimeout(() => this.saveSuccess = false, 3000);
      },
    });
  }

  isCategoryPreferred(catName: string): boolean {
    return this.preferences.some(p => p.category_name === catName);
  }

  togglePreference(cat: Category): void {
    if (this.isCategoryPreferred(cat.name)) {
      this.userService.removePreference(cat.name).subscribe(() => {
        this.preferences = this.preferences.filter(p => p.category_name !== cat.name);
      });
    } else {
      this.userService.addPreference({ categoryName: cat.name, categoryId: cat.id }).subscribe(res => {
        this.preferences = [...this.preferences, res.preference];
      });
    }
  }

  getInitial(): string {
    return this.profile?.username?.[0]?.toUpperCase() || 'U';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
}
