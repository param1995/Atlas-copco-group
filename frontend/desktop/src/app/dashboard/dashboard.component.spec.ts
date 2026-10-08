import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { MetricCard, TrendRow } from '../models/dashboard.models';
import { DashboardStore } from '../services/dashboard-store.service';
import { DashboardComponent } from './dashboard.component';

const metrics: MetricCard[] = [
  { name: 'Velocity', value: '102.3', unit: 'm/s', status: 'Normal', tone: 'ok', samples: [] },
  { name: 'Pressure', value: '7.6', unit: 'bar', status: 'Warning', tone: 'warning', samples: [] },
  { name: 'Temperature', value: '61.8', unit: '°C', status: 'Normal', tone: 'ok', samples: [] },
  { name: 'Flow', value: '82.1', unit: 'L/min', status: 'Normal', tone: 'ok', samples: [] }
];

const history: TrendRow[] = [
  { time: '22:00:00', velocity: 102.3, pressure: 7.6, temperature: 61.8, flow: 82.1, status: 'Warning' }
];

describe('DashboardComponent', () => {
  let store: jasmine.SpyObj<DashboardStore> & DashboardStore;

  beforeEach(async () => {
    store = {
      metrics,
      trendData: history,
      conditions: [{ label: 'Air intake', value: 'Clean', detail: 'Filter efficiency 96%' }],
      services: [{ label: 'Cooling loop', state: 'Nominal', tone: 'ok' }],
      systemStatus: 'Warning',
      updatedAt: '10:00:00 PM',
      loadError: '',
      isLoading: false,
      canExport: true,
      isExportingExcel: false,
      exportMessage: '',
      theme: 'light',
      velocityUnit: 'm/s',
      pressureUnit: 'bar',
      temperatureUnit: '°C',
      velocityUnits: ['mm/s', 'cm/s', 'm/s', 'km/h', 'ft/s'],
      pressureUnits: ['Pa', 'kPa', 'mbar', 'bar', 'psi', 'atm'],
      temperatureUnits: ['°C', '°F', 'K'],
      refreshDashboard: jasmine.createSpy('refreshDashboard'),
      exportCsv: jasmine.createSpy('exportCsv'),
      exportExcel: jasmine.createSpy('exportExcel'),
      setVelocityUnit: jasmine.createSpy('setVelocityUnit'),
      setPressureUnit: jasmine.createSpy('setPressureUnit'),
      setTemperatureUnit: jasmine.createSpy('setTemperatureUnit')
    } as unknown as jasmine.SpyObj<DashboardStore> & DashboardStore;

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), { provide: DashboardStore, useValue: store }]
    }).compileComponents();
  });

  function renderDashboard() {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the overview metrics and a navigation link to Trends', () => {
    const fixture = renderDashboard();
    const dashboard = fixture.nativeElement as HTMLElement;

    expect(dashboard.querySelectorAll('.metric-card')).toHaveSize(4);
    expect(dashboard.querySelectorAll('app-live-trend-chart')).toHaveSize(0);
    expect(dashboard.querySelector('a.trends-link[routerLink="/trends"]')?.textContent).toContain('Open live trends');
    expect(dashboard.querySelector('[aria-label="System warning"]')?.textContent).toContain('Pressure');
  });

  it('delegates unit and export actions to the shared store', () => {
    const fixture = renderDashboard();
    const element = fixture.nativeElement as HTMLElement;
    const selector = element.querySelector('[aria-label="Velocity display unit"]') as HTMLSelectElement;
    selector.value = 'km/h';
    selector.dispatchEvent(new Event('change', { bubbles: true }));
    (element.querySelector('button.secondary-button') as HTMLButtonElement).click();
    (element.querySelectorAll('button.secondary-button')[1] as HTMLButtonElement).click();

    expect(store.setVelocityUnit).toHaveBeenCalledWith('km/h');
    expect(store.exportCsv).toHaveBeenCalled();
    expect(store.exportExcel).toHaveBeenCalled();

    store.velocityUnit = 'km/h';
    fixture.detectChanges();
    expect(selector.value).toBe('km/h');
  });
});