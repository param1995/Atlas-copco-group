import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { DashboardStore } from './services/dashboard-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app-shell.component.html',
})
export class AppComponent implements OnInit {
  readonly store = inject(DashboardStore);

  ngOnInit(): void {
    void this.store.start();
  }
}
