import { TestBed } from '@angular/core/testing';

import { DashboardStore } from '../services/dashboard-store.service';
import { TrendsComponent } from './trends.component';

describe('TrendsComponent', () => {
  let store: jasmine.SpyObj<DashboardStore>;

  beforeEach(async () => {
    store = jasmine.createSpyObj<DashboardStore>('DashboardStore', ['refreshDashboard']);
    Object.assign(store, {
      metrics: [
        { name: 'Velocity', value: '102.3', unit: 'm/s', status: 'Normal', tone: 'ok', samples: [] },
        { name: 'Pressure', value: '7.6', unit: 'bar', status: 'Warning', tone: 'warning', samples: [] },
        { name: 'Temperature', value: '61.8', unit: '°C', status: 'Normal', tone: 'ok', samples: [] },
        { name: 'Flow', value: '82.1', unit: 'L/min', status: 'Normal', tone: 'ok', samples: [] }
      ],
      trendData: [
        { time: '22:00:00', velocity: 102.3, pressure: 7.6, temperature: 61.8, flow: 82.1, status: 'Warning' }
      ],
      systemStatus: 'Warning',
      loadError: '',
      isRefreshing: false,
      theme: 'light',
      velocityUnit: 'm/s',
      pressureUnit: 'bar',
      temperatureUnit: '°C'
    });

    await TestBed.configureTestingModule({
      imports: [TrendsComponent],
      providers: [{ provide: DashboardStore, useValue: store }]
    }).compileComponents();
  });

  it('renders four parameter charts and timestamped history', () => {
    const fixture = TestBed.createComponent(TrendsComponent);
    fixture.detectChanges();
    const trends = fixture.nativeElement as HTMLElement;

    expect(trends.querySelectorAll('app-live-trend-chart')).toHaveSize(4);
    expect(trends.querySelector('.trend-table tbody')?.textContent).toContain('22:00:00');
    expect(trends.querySelector('.trend-table thead')?.textContent).toContain('Velocity (m/s)');
  });

  it('exposes a retry action when the shared store reports an error', () => {
    store.loadError = 'Telemetry unavailable';
    const fixture = TestBed.createComponent(TrendsComponent);
    fixture.detectChanges();
    const trends = fixture.nativeElement as HTMLElement;

    expect(trends.querySelector('[role="alert"]')?.textContent).toContain('Telemetry unavailable');
    (trends.querySelector('.error-state button') as HTMLButtonElement).click();
    expect(store.refreshDashboard).toHaveBeenCalled();
  });

  it('places refresh on the right side of the Trends heading and shows its busy state', () => {
    const fixture = TestBed.createComponent(TrendsComponent);
    fixture.detectChanges();
    const trends = fixture.nativeElement as HTMLElement;
    const refresh = trends.querySelector('.trends-header-actions .refresh-button') as HTMLButtonElement;

    expect(refresh.textContent).toContain('Refresh trends');
    expect(refresh.disabled).toBeFalse();

    store.isRefreshing = true;
    fixture.detectChanges();
    expect(refresh.textContent).toContain('Updating');
    expect(refresh.disabled).toBeTrue();
  });
});