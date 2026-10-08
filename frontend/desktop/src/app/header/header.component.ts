import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import type { Theme } from '../models/dashboard.models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html'
})
export class HeaderComponent {
  private readonly router = inject(Router);
  @Input() theme: Theme = 'light';
  @Input() isLoading = false;
  @Output() themeChange = new EventEmitter<Theme>();
  @Output() refresh = new EventEmitter<void>();

  get showRefresh(): boolean {
    return !this.router.url.startsWith('/trends');
  }
}