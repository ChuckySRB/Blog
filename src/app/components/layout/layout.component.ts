import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { NavigationComponent } from '../navigation/navigation.component';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { PolaroidImgComponent } from '../polaroid-img/polaroid-img.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    NavigationComponent,
    BlogCardComponent,
    SidebarComponent,
    PolaroidImgComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {

}
