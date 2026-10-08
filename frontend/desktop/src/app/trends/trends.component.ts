import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { LiveTrendChartComponent } from '../live-trend-data/live-trend-chart.component';
import { DashboardStore } from '../core/services/dashboard-store.service';
@Component({
  selector: 'app-trends',
  standalone: true,
  imports: [DecimalPipe, LiveTrendChartComponent],
  templateUrl: './trends.component.html',
  styleUrl: './trends.component.scss'
})
export class TrendsComponent {
  readonly store = inject(DashboardStore);
}