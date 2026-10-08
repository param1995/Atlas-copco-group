import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

import type { MetricCard, TrendRow } from '../models/dashboard.models';
import { DashboardStore } from '../core/services/dashboard-store.service';
import { DashboardComponent } from './dashboard.component';

const metrics: MetricCard[] = [
  {
    name: 'Velocity',
    value: '102.3',
    unit: 'm/s',
    status: 'Normal',
    tone: 'ok',
    samples: []
  },
  {
    name: 'Pressure',
    value: '7.6',
    unit: 'bar',
    status: 'Warning',
    tone: 'warning',
    samples: []
  },
  {
    name: 'Temperature',
    value: '61.8',
    unit: '°C',
    status: 'Normal',
    tone: 'ok',
    samples: []
  },
  {
    name: 'Flow',
    value: '82.1',
    unit: 'L/min',
    status: 'Normal',
    tone: 'ok',
    samples: []
  }
];

const history: TrendRow[] = [
  {
    time: '22:00:00',
    velocity: 102.3,
    pressure: 7.6,
    temperature: 61.8,
    flow: 82.1,
    status: 'Warning'
  }
];

describe('DashboardComponent', () => {
  let store: any;

  beforeEach(async () => {
    store = {
      metrics,
      trendData: history,

      conditions: [
        {
          label: 'Air intake',
          value: 'Clean',
          detail: 'Filter efficiency 96%'
        }
      ],

      services: [
        {
          label: 'Cooling loop',
          state: 'Nominal',
          tone: 'ok'
        }
      ],

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

      velocityUnits: [
        'mm/s',
        'cm/s',
        'm/s',
        'km/h',
        'ft/s'
      ],

      pressureUnits: [
        'Pa',
        'kPa',
        'mbar',
        'bar',
        'psi',
        'atm'
      ],

      temperatureUnits: [
        '°C',
        '°F',
        'K'
      ],

      refreshDashboard: jasmine.createSpy('refreshDashboard'),

      exportCsv: jasmine.createSpy('exportCsv'),

      exportExcel: jasmine.createSpy('exportExcel'),

      setVelocityUnit: jasmine.createSpy('setVelocityUnit'),

      setPressureUnit: jasmine.createSpy('setPressureUnit'),

      setTemperatureUnit: jasmine.createSpy(
        'setTemperatureUnit'
      )
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],

      providers: [
        provideRouter([]),

        {
          provide: DashboardStore,
          useValue: store
        }
      ]
    }).compileComponents();
  });

  function renderDashboard() {
    const fixture =
      TestBed.createComponent(DashboardComponent);

    fixture.detectChanges();

    return fixture;
  }

  it('renders the overview metrics and a navigation link to Trends', () => {
    const fixture = renderDashboard();

    const dashboard =
      fixture.nativeElement as HTMLElement;

    // Verify four metric cards
    expect(
      dashboard.querySelectorAll('.metric-card')
    ).toHaveSize(4);

    // Dashboard should not render the live trend chart
    expect(
      dashboard.querySelectorAll('app-live-trend-chart')
    ).toHaveSize(0);

    // Verify Trends navigation
    const trendsLink =
      dashboard.querySelector(
        '[routerLink="/trends"]'
      );

    expect(trendsLink).not.toBeNull();

    expect(
      trendsLink?.textContent?.trim()
    ).toContain('Open live trends');

    // Verify system warning
    const warning =
      dashboard.querySelector(
        '[aria-label="System warning"]'
      );

    expect(warning).not.toBeNull();

    expect(
      warning?.textContent
    ).toContain('Pressure');
  });

  it('delegates velocity unit changes to the shared store', () => {
    const fixture = renderDashboard();

    const selector =
      fixture.debugElement.query(
        By.css(
          '[aria-label="Velocity display unit"]'
        )
      );

    expect(selector).not.toBeNull();

    // Trigger Angular ngModelChange directly
    selector.triggerEventHandler(
      'ngModelChange',
      'km/h'
    );

    expect(
      store.setVelocityUnit
    ).toHaveBeenCalledWith('km/h');
  });

  it('delegates CSV export to the shared store', () => {
    const fixture = renderDashboard();

    const element =
      fixture.nativeElement as HTMLElement;

    const csvButton =
      element.querySelector(
        'button.secondary-button'
      ) as HTMLButtonElement | null;

    expect(csvButton).not.toBeNull();

    if (!csvButton) {
      return;
    }

    csvButton.click();

    expect(
      store.exportCsv
    ).toHaveBeenCalled();
  });

  it('delegates Excel export to the shared store', () => {
    const fixture = renderDashboard();

    const element =
      fixture.nativeElement as HTMLElement;

    const buttons =
      element.querySelectorAll(
        'button.secondary-button'
      );

    expect(buttons.length).toBeGreaterThan(1);

    const excelButton =
      buttons[1] as HTMLButtonElement;

    excelButton.click();

    expect(
      store.exportExcel
    ).toHaveBeenCalled();
  });

  it('renders all supported velocity units in the selector', () => {
    const fixture = renderDashboard();

    const element =
      fixture.nativeElement as HTMLElement;

    const selector =
      element.querySelector(
        '[aria-label="Velocity display unit"]'
      ) as HTMLSelectElement | null;

    expect(selector).not.toBeNull();

    if (!selector) {
      return;
    }

    const options = Array.from(
      selector.options
    ).map(option => option.value);

    expect(options).toContain('mm/s');
    expect(options).toContain('cm/s');
    expect(options).toContain('m/s');
    expect(options).toContain('km/h');
    expect(options).toContain('ft/s');
  });
}); 