import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import type { Chart as ChartInstance, ChartConfiguration } from 'chart.js';
import type { Theme, TrendPoint } from '../models/dashboard.models';

type Palette = {
  line: string;
  fill: string;
  text: string;
  grid: string;
};

const metricColors: Record<string, { light: string; dark: string }> = {
  velocity: { light: '#2673b8', dark: '#69b9ff' },
  pressure: { light: '#be642b', dark: '#ffad75' },
  temperature: { light: '#b94b55', dark: '#ff8991' },
  flow: { light: '#21836c', dark: '#66cfad' }
};

let chartLibraryPromise: Promise<typeof import('chart.js/auto').Chart> | undefined;

function loadChartLibrary(): Promise<typeof import('chart.js/auto').Chart> {
  chartLibraryPromise ??= Promise.all([
    import('chart.js/auto'),
    import('chartjs-plugin-zoom')
  ]).then(([chartModule, zoomModule]) => {
    chartModule.Chart.register(zoomModule.default);
    return chartModule.Chart;
  });

  return chartLibraryPromise;
}

@Component({
  selector: 'app-live-trend-chart',
  standalone: true,
  template: `
    <div class="chart-toolbar" role="group" [attr.aria-label]="metricName + ' chart controls'">
      <button class="chart-control" type="button" aria-label="Zoom in" title="Zoom in" (click)="zoomIn()">+</button>
      <button class="chart-control" type="button" aria-label="Zoom out" title="Zoom out" (click)="zoomOut()">−</button>
      <button
        class="chart-control pan-control"
        type="button"
        [class.active]="panEnabled"
        [attr.aria-pressed]="panEnabled"
        aria-label="Pan chart"
        title="Pan chart"
        (click)="togglePan()"
      >
        Pan
      </button>
      <button class="chart-control reset-control" type="button" aria-label="Reset zoom" title="Reset zoom" [disabled]="!isZoomed" (click)="resetZoom()">
        Reset
      </button>
    </div>
    <canvas #canvas role="img" [attr.aria-label]="chartLabel"></canvas>
    <p class="visually-hidden">{{ metricName }} line chart, latest {{ visibleSamples.length }} timestamped samples.</p>
  `,
  styles: [`
    :host { display: block; height: 258px; min-width: 0; }
    .chart-toolbar { display: flex; align-items: center; justify-content: flex-end; gap: 4px; height: 34px; }
    .chart-control { min-width: 30px; height: 28px; padding: 0 8px; border: 1px solid var(--line); border-radius: 4px; background: var(--surface); color: var(--ink); font: inherit; font-size: 13px; font-weight: 650; cursor: pointer; }
    .chart-control:hover:not(:disabled), .chart-control.active { border-color: var(--accent); color: var(--accent-strong); }
    .chart-control:disabled { cursor: not-allowed; opacity: 0.5; }
    .pan-control { min-width: 46px; }
    .reset-control { min-width: 52px; }
    canvas { display: block; width: 100% !important; height: 220px !important; }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      clip-path: inset(50%);
    }
  `]
})
export class LiveTrendChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) metricName = '';
  @Input() unit = '';
  @Input() samples: TrendPoint[] = [];
  @Input() theme: Theme = 'light';
  @ViewChild('canvas') private canvas?: ElementRef<HTMLCanvasElement>;

  private chart?: ChartInstance<'line', number[], string>;
  private destroyed = false;
  panEnabled = false;
  isZoomed = false;

  get visibleSamples(): TrendPoint[] {
    return this.samples.slice(-100);
  }

  get chartLabel(): string {
    return `${this.metricName} in ${this.unit}, plotted by timestamp`;
  }

  async ngAfterViewInit(): Promise<void> {
    const Chart = await loadChartLibrary();
    if (this.destroyed || !this.canvas) {
      return;
    }

    this.chart = new Chart(this.canvas.nativeElement, this.createConfiguration());
    this.updateChart();
  }

  zoomIn(): void {
    this.chart?.zoom(1.2);
    this.isZoomed = true;
  }

  zoomOut(): void {
    this.chart?.zoom(0.8);
    this.isZoomed = true;
  }

  togglePan(): void {
    this.panEnabled = !this.panEnabled;
    const zoomOptions = this.chart?.options.plugins?.zoom;
    if (zoomOptions?.pan) {
      zoomOptions.pan.enabled = this.panEnabled;
      this.chart?.update('none');
    }
  }

  resetZoom(): void {
    this.chart?.resetZoom();
    this.isZoomed = false;
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.updateChart();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.chart?.destroy();
  }

  private createConfiguration(): ChartConfiguration<'line', number[], string> {
    const palette = this.getPalette();

    return {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: `${this.metricName} (${this.unit})`,
          data: [],
          borderColor: palette.line,
          backgroundColor: palette.fill,
          borderWidth: 2,
          pointRadius: 0,
          pointHitRadius: 8,
          tension: 0.28,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        normalized: true,
        color: palette.text,
        animation: { duration: 650, easing: 'linear' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: (items) => {
                const sample = this.visibleSamples[items[0]?.dataIndex ?? -1];
                return sample ? `Timestamp: ${this.formatTimestamp(sample.timestamp)}` : '';
              },
              label: (item) => `Value: ${item.parsed.y?.toFixed(1) ?? '—'}`,
              afterLabel: () => `Unit: ${this.unit}`
            }
          },
          zoom: {
            limits: {
              x: { min: 'original', max: 'original' },
              y: { min: 'original', max: 'original' }
            },
            pan: { enabled: this.panEnabled, mode: 'x', threshold: 4 },
            zoom: {
              mode: 'xy',
              wheel: { enabled: false },
              pinch: { enabled: true },
              onZoomComplete: () => {
                this.isZoomed = true;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Timestamp' },
            ticks: { autoSkip: true, maxTicksLimit: 6, maxRotation: 0, color: palette.text },
            grid: { color: palette.grid }
          },
          y: {
            title: { display: true, text: this.unit },
            ticks: { color: palette.text },
            grid: { color: palette.grid }
          }
        }
      }
    };
  }

  private updateChart(): void {
    if (!this.chart) {
      return;
    }

    const samples = this.visibleSamples;
    const palette = this.getPalette();
    this.chart.data.labels = samples.map((sample) => this.formatTimestamp(sample.timestamp));
    this.chart.data.datasets[0].data = samples.map((sample) => sample.value);
    this.chart.data.datasets[0].label = `${this.metricName} (${this.unit})`;
    this.chart.data.datasets[0].borderColor = palette.line;
    this.chart.data.datasets[0].backgroundColor = palette.fill;
    this.chart.options.color = palette.text;

    const scales = this.chart.options.scales as unknown as Record<string, {
      grid?: { color?: string };
      ticks?: { color?: string };
      title?: { text?: string | string[] };
    }>;
    for (const scale of Object.values(scales)) {
      if (scale.grid) {
        scale.grid.color = palette.grid;
      }
      if (scale.ticks) {
        scale.ticks.color = palette.text;
      }
    }
    if (scales['y']?.title) {
      scales['y'].title.text = this.unit;
    }

    this.chart.update();
  }

  private getPalette(): Palette {
    const dark = this.theme === 'dark';
    const line = metricColors[this.metricName.toLowerCase()] ?? metricColors['velocity'];
    return {
      line: dark ? line.dark : line.light,
      fill: dark ? `${line.dark}24` : `${line.light}18`,
      text: dark ? '#a7b5ae' : '#66746e',
      grid: dark ? '#35433d' : '#dce4df'
    };
  }

  private formatTimestamp(timestamp: string): string {
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime())
      ? timestamp
      : parsed.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}