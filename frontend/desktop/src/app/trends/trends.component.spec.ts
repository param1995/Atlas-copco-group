import { TestBed } from '@angular/core/testing';
import { DashboardStore } from '../core/services/dashboard-store.service';
import { TrendsComponent } from './trends.component';

describe('TrendsComponent', () => {
  let store: any;
  beforeEach(async () => {
    store = {
      metrics: [
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
      ],

      trendData: [
        {
          time: '22:00:00',
          velocity: 102.3,
          pressure: 7.6,
          temperature: 61.8,
          flow: 82.1,
          status: 'Warning'
        }
      ],

      systemStatus: 'Warning',

      loadError: '',

      isRefreshing: false,

      theme: 'light',

      velocityUnit: 'm/s',

      pressureUnit: 'bar',

      temperatureUnit: '°C',

      refreshDashboard:
        jasmine.createSpy('refreshDashboard')
    };

    await TestBed.configureTestingModule({
      imports: [TrendsComponent],

      providers: [
        {
          provide: DashboardStore,
          useValue: store
        }
      ]
    }).compileComponents();
  });

  function renderTrends() {
    const fixture =
      TestBed.createComponent(TrendsComponent);

    fixture.detectChanges();

    return fixture;
  }

  it('renders four parameter charts and timestamped history', () => {
    const fixture = renderTrends();

    const trends =
      fixture.nativeElement as HTMLElement;

    // Verify four parameter charts
    expect(
      trends.querySelectorAll(
        'app-live-trend-chart'
      )
    ).toHaveSize(4);

    // Verify timestamped history
    expect(
      trends.querySelector(
        '.trend-table tbody'
      )?.textContent
    ).toContain('22:00:00');

    // Verify velocity column
    expect(
      trends.querySelector(
        '.trend-table thead'
      )?.textContent
    ).toContain('Velocity (m/s)');
  });

  it('exposes a retry action when the shared store reports an error', () => {
    // Set error BEFORE rendering
    store.loadError = 'Telemetry unavailable';

    const fixture = renderTrends();

    const trends =
      fixture.nativeElement as HTMLElement;

    // Verify error message
    expect(
      trends.querySelector(
        '[role="alert"]'
      )?.textContent
    ).toContain('Telemetry unavailable');

    // Verify retry button
    const retryButton =
      trends.querySelector(
        '.error-state button'
      ) as HTMLButtonElement | null;

    expect(retryButton).not.toBeNull();

    if (!retryButton) {
      return;
    }

    retryButton.click();

    expect(
      store.refreshDashboard
    ).toHaveBeenCalled();
  });

  it('shows the refresh button when telemetry has an error', () => {
    // The refresh button is inside @if (store.loadError)
    store.loadError = 'Telemetry unavailable';

    const fixture = renderTrends();

    const trends =
      fixture.nativeElement as HTMLElement;

    const refresh =
      trends.querySelector(
        '.trends-header-actions .refresh-button'
      ) as HTMLButtonElement | null;

    expect(refresh).not.toBeNull();

    if (!refresh) {
      return;
    }

    // Normal refresh state
    expect(
      refresh.textContent
    ).toContain('Refresh trends');

    expect(
      refresh.disabled
    ).toBeFalse();

    expect(
      refresh.getAttribute('aria-busy')
    ).toBe('false');
  });

  it('shows Updating and disables refresh while refreshing', () => {
    // Button only exists when loadError is present
    store.loadError = 'Telemetry unavailable';
    store.isRefreshing = true;

    const fixture = renderTrends();

    const trends =
      fixture.nativeElement as HTMLElement;

    const refresh =
      trends.querySelector(
        '.trends-header-actions .refresh-button'
      ) as HTMLButtonElement | null;

    expect(refresh).not.toBeNull();

    if (!refresh) {
      return;
    }

    // Busy state
    expect(
      refresh.textContent
    ).toContain('Updating');

    expect(
      refresh.disabled
    ).toBeTrue();

    expect(
      refresh.getAttribute('aria-busy')
    ).toBe('true');
  });

  it('calls refreshDashboard when the header refresh button is clicked', () => {
    store.loadError = 'Telemetry unavailable';

    const fixture = renderTrends();

    const trends =
      fixture.nativeElement as HTMLElement;

    const refresh =
      trends.querySelector(
        '.trends-header-actions .refresh-button'
      ) as HTMLButtonElement | null;

    expect(refresh).not.toBeNull();

    if (!refresh) {
      return;
    }

    refresh.click();

    expect(
      store.refreshDashboard
    ).toHaveBeenCalled();
  });
});