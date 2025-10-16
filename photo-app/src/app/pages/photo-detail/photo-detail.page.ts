import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, NavController } from '@ionic/angular';
import { Photo } from '../../models/photo.model';
import { PhotoService } from '../../services/photo.service';

@Component({
  selector: 'app-photo-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './photo-detail.page.html',
  styleUrls: ['./photo-detail.page.scss']
})
export class PhotoDetailPage implements OnInit {
  photo?: Photo;
  photoSrc = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private photoService: PhotoService,
    private nav: NavController
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(async params => {
      const id = params.get('id');
      if (!id) {
        await this.router.navigate(['/gallery']);
        return;
      }

      const p = this.photoService.getById(id);
      if (!p) {
        await this.router.navigate(['/gallery']);
        return;
      }

      this.photo = p;
      this.photoSrc = await this.photoService.getPhotoSrc(p);
    });
  }

  async toggleLike(): Promise<void> {
    if (!this.photo) return;
    this.photo.liked = !this.photo.liked;
    await this.photoService.update(this.photo);
  }

  async deletePhoto(): Promise<void> {
    if (!this.photo) return;
    await this.photoService.remove(this.photo.id);
    await this.nav.navigateRoot(['/gallery']);
  }
}
