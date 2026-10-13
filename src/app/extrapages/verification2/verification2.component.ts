import { Component, OnInit } from '@angular/core';
import { SlickCarouselModule } from 'ngx-slick-carousel';

@Component({
    selector: 'app-verification2',
    templateUrl: './verification2.component.html',
    styleUrls: ['./verification2.component.scss'],
    imports: [SlickCarouselModule]
})
export class Verification2Component implements OnInit {

  year: number = new Date().getFullYear();
  ngOnInit(): void {
  }

  slideConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true
  };
}
