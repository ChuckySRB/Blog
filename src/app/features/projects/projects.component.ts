import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LowerCasePipe } from '@angular/common';

interface Project {
  name: string;
  description: string;
  tech: string[];
  url: string;
  status: 'active' | 'archived' | 'wip';
}

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, LowerCasePipe],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss'
})
export class ProjectsComponent {
  projects: Project[] = [
    {
      name: 'ChuckyLab Blogs',
      description: 'A neo-retro terminal-themed personal blog built with Angular, SCSS, and ngx-markdown.',
      tech: ['Angular', 'SCSS', 'TypeScript'],
      url: 'https://github.com/ChuckySRB/Blog',
      status: 'active'
    },
    {
      name: 'Data Pipeline Engine',
      description: 'Automated ETL pipeline for processing large datasets with Python and Apache Spark.',
      tech: ['Python', 'Spark', 'Docker'],
      url: '#',
      status: 'wip'
    },
    {
      name: 'Terminal UI Kit',
      description: 'A CSS/SCSS component library for building terminal-inspired web interfaces.',
      tech: ['CSS', 'SCSS', 'Design'],
      url: '#',
      status: 'wip'
    }
  ];

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: '● ONLINE',
      archived: '○ ARCHIVED',
      wip: '◐ IN PROGRESS'
    };
    return labels[status] || status;
  }
}
