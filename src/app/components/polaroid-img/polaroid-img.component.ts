import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-polaroid-img',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './polaroid-img.component.html',
  styleUrl: './polaroid-img.component.scss'
})
export class PolaroidImgComponent implements OnInit {
  @Input() src: string = '';
  @Input() caption: string = '';
  rotation: number = 0;

  ngOnInit() {
    // Rotate between -3 and 3 degrees randomly
    this.rotation = Math.floor(Math.random() * 6) - 3;
  }
}
