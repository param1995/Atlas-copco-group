import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardStore } from '../core/services/dashboard-store.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  readonly store = inject(DashboardStore);

  get metrics() { return this.store.metrics; }
  get trendData() { return this.store.trendData; }
  get conditions() { return this.store.conditions; }
  get services() { return this.store.services; }
  get systemStatus() { return this.store.systemStatus; }
  get updatedAt() { return this.store.updatedAt; }
  get loadError() { return this.store.loadError; }
  get isLoading() { return this.store.isLoading; }
  get canExport() { return this.store.canExport; }
  get isExportingExcel() { return this.store.isExportingExcel; }
  get exportMessage() { return this.store.exportMessage; }
  get velocityUnit() { return this.store.velocityUnit; }
  get pressureUnit() { return this.store.pressureUnit; }
  get temperatureUnit() { return this.store.temperatureUnit; }
  get velocityUnits() { return this.store.velocityUnits; }
  get pressureUnits() { return this.store.pressureUnits; }
  get temperatureUnits() { return this.store.temperatureUnits; }

  get statusLabel(): string {
    if (this.loadError) {
      return 'Connection issue';
    }
    if (this.isLoading) {
      return 'Updating';
    }
    if (this.systemStatus === 'Warning') {
      return 'Attention required';
    }
    return this.systemStatus === 'Healthy' ? 'All systems normal' : 'Awaiting telemetry';
  }

  get warningMetricNames(): string {
    return this.store.metrics
      .filter((metric) => metric.status === 'Warning')
      .map((metric) => metric.name)
      .join(', ');
  }
}