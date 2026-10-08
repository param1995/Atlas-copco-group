import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import type { TrendPoint } from '../models/dashboard.models';
import { LiveTrendChartComponent } from './live-trend-chart.component';

describe('LiveTrendChartComponent', () => {
  let component: LiveTrendChartComponent;
  let fixture: ComponentFixture<LiveTrendChartComponent>;

  const samples: TrendPoint[] = [
    {
      timestamp: '2026-10-08T10:00:00',
      value: 100
    },
    {
      timestamp: '2026-10-08T10:00:01',
      value: 102.3
    },
    {
      timestamp: '2026-10-08T10:00:02',
      value: 105.6
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveTrendChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(
      LiveTrendChartComponent
    );

    component = fixture.componentInstance;

    component.metricName = 'Velocity';
    component.unit = 'm/s';
    component.samples = samples;
    component.theme = 'light';

    /*
     * IMPORTANT:
     * Do NOT call fixture.detectChanges() here.
     *
     * detectChanges() triggers ngAfterViewInit()
     * and creates a real Chart.js instance.
     */
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return samples when less than 100 samples exist', () => {
    expect(component.visibleSamples).toEqual(samples);
    expect(component.visibleSamples.length).toBe(3);
  });

  it('should return only the latest 100 samples', () => {
    const manySamples: TrendPoint[] = Array.from(
      { length: 120 },
      (_, index) => ({
        timestamp: `2026-10-08T10:00:${String(index).padStart(2, '0')}`,
        value: index
      })
    );

    component.samples = manySamples;

    expect(component.visibleSamples.length).toBe(100);
    expect(component.visibleSamples[0].value).toBe(20);
    expect(component.visibleSamples[99].value).toBe(119);
  });

  it('should return the correct chart label', () => {
    component.metricName = 'Pressure';
    component.unit = 'bar';

    expect(component.chartLabel).toBe(
      'Pressure in bar, plotted by timestamp'
    );
  });

  it('should render chart controls and accessible canvas', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[aria-label="Zoom in"]')
    ).not.toBeNull();

    expect(
      element.querySelector('[aria-label="Zoom out"]')
    ).not.toBeNull();

    expect(
      element.querySelector('[aria-label="Pan chart"]')
    ).not.toBeNull();

    expect(
      element.querySelector('[aria-label="Reset zoom"]')
    ).not.toBeNull();

    const canvas = element.querySelector('canvas');

    expect(canvas).not.toBeNull();

    expect(
      canvas?.getAttribute('role')
    ).toBe('img');

    expect(
      canvas?.getAttribute('aria-label')
    ).toBe(component.chartLabel);
  });

  it('should initially have pan disabled and zoom reset', () => {
    expect(component.panEnabled).toBeFalse();
    expect(component.isZoomed).toBeFalse();
  });

  it('should toggle pan without a chart', () => {
    expect(component.panEnabled).toBeFalse();

    component.togglePan();

    expect(component.panEnabled).toBeTrue();

    component.togglePan();

    expect(component.panEnabled).toBeFalse();
  });

  it('should set zoomed state when zooming in without a chart', () => {
    (component as any).chart = undefined;

    component.zoomIn();

    expect(component.isZoomed).toBeTrue();
  });

  it('should set zoomed state when zooming out without a chart', () => {
    (component as any).chart = undefined;
    component.isZoomed = false;

    component.zoomOut();

    expect(component.isZoomed).toBeTrue();
  });

  it('should reset zoom state without a chart', () => {
    (component as any).chart = undefined;
    component.isZoomed = true;

    component.resetZoom();

    expect(component.isZoomed).toBeFalse();
  });

  it('should update component when inputs change without a chart', () => {
    (component as any).chart = undefined;

    component.ngOnChanges({});

    expect(component.visibleSamples.length).toBe(3);

    expect(component.chartLabel).toBe(
      'Velocity in m/s, plotted by timestamp'
    );
  });

  it('should support dark theme', () => {
    component.theme = 'dark';

    component.ngOnChanges({});

    expect(component.theme).toBe('dark');
  });

  it('should support all metric names', () => {
    const metricNames = [
      'Velocity',
      'Pressure',
      'Temperature',
      'Flow'
    ];

    for (const metricName of metricNames) {
      component.metricName = metricName;

      component.ngOnChanges({});

      expect(
        component.chartLabel
      ).toContain(metricName);
    }
  });

  it('should support an unknown metric name', () => {
    component.metricName = 'Unknown Metric';

    component.ngOnChanges({});

    expect(
      component.chartLabel
    ).toBe(
      'Unknown Metric in m/s, plotted by timestamp'
    );
  });

  it('should handle invalid timestamp', () => {
    const formatTimestamp = (component as any)
      .formatTimestamp
      .bind(component);

    expect(
      formatTimestamp('invalid-date')
    ).toBe('invalid-date');
  });

  it('should format valid timestamp', () => {
    const formatTimestamp = (component as any)
      .formatTimestamp
      .bind(component);

    const result = formatTimestamp(
      '2026-10-08T10:00:00.000Z'
    );

    expect(result).not.toBe(
      '2026-10-08T10:00:00.000Z'
    );

    expect(result).toMatch(
      /^\d{2}:\d{2}:\d{2}\s?(AM|PM)?$/
    );
  });

  it('should get light velocity palette', () => {
    component.metricName = 'Velocity';
    component.theme = 'light';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#2673b8');
    expect(palette.fill).toBe('#2673b818');
    expect(palette.text).toBe('#66746e');
    expect(palette.grid).toBe('#dce4df');
  });

  it('should get dark velocity palette', () => {
    component.metricName = 'Velocity';
    component.theme = 'dark';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#69b9ff');
    expect(palette.fill).toBe('#69b9ff24');
    expect(palette.text).toBe('#a7b5ae');
    expect(palette.grid).toBe('#35433d');
  });

  it('should get light pressure palette', () => {
    component.metricName = 'Pressure';
    component.theme = 'light';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#be642b');
    expect(palette.fill).toBe('#be642b18');
  });

  it('should get dark pressure palette', () => {
    component.metricName = 'Pressure';
    component.theme = 'dark';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#ffad75');
    expect(palette.fill).toBe('#ffad7524');
  });

  it('should get light temperature palette', () => {
    component.metricName = 'Temperature';
    component.theme = 'light';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#b94b55');
    expect(palette.fill).toBe('#b94b5518');
  });

  it('should get dark temperature palette', () => {
    component.metricName = 'Temperature';
    component.theme = 'dark';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#ff8991');
    expect(palette.fill).toBe('#ff899124');
  });

  it('should get light flow palette', () => {
    component.metricName = 'Flow';
    component.theme = 'light';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#21836c');
    expect(palette.fill).toBe('#21836c18');
  });

  it('should get dark flow palette', () => {
    component.metricName = 'Flow';
    component.theme = 'dark';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#66cfad');
    expect(palette.fill).toBe('#66cfad24');
  });

  it('should use velocity palette for unknown metric in light theme', () => {
    component.metricName = 'Unknown';
    component.theme = 'light';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#2673b8');
    expect(palette.fill).toBe('#2673b818');
  });

  it('should use velocity palette for unknown metric in dark theme', () => {
    component.metricName = 'Unknown';
    component.theme = 'dark';

    const palette = (component as any).getPalette();

    expect(palette.line).toBe('#69b9ff');
    expect(palette.fill).toBe('#69b9ff24');
  });

  it('should create line chart configuration', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    expect(config.type).toBe('line');

    expect(config.data.labels).toEqual([]);

    expect(config.data.datasets.length).toBe(1);

    expect(
      config.data.datasets[0].label
    ).toBe('Velocity (m/s)');

    expect(
      config.data.datasets[0].data
    ).toEqual([]);

    expect(
      config.data.datasets[0].borderColor
    ).toBe('#2673b8');

    expect(
      config.data.datasets[0].backgroundColor
    ).toBe('#2673b818');

    expect(
      config.data.datasets[0].borderWidth
    ).toBe(2);

    expect(
      config.data.datasets[0].pointRadius
    ).toBe(0);

    expect(
      config.data.datasets[0].pointHitRadius
    ).toBe(8);

    expect(
      config.data.datasets[0].tension
    ).toBe(0.28);

    expect(
      config.data.datasets[0].fill
    ).toBeTrue();
  });

  it('should create dark theme configuration', () => {
    component.theme = 'dark';
    component.metricName = 'Pressure';
    component.unit = 'bar';

    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    expect(
      config.data.datasets[0].label
    ).toBe('Pressure (bar)');

    expect(
      config.data.datasets[0].borderColor
    ).toBe('#ffad75');

    expect(
      config.data.datasets[0].backgroundColor
    ).toBe('#ffad7524');

    expect(
      config.options?.color
    ).toBe('#a7b5ae');
  });

  it('should configure zoom and pan options', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    expect(options.responsive).toBeTrue();
    expect(options.maintainAspectRatio).toBeFalse();
    expect(options.normalized).toBeTrue();

    expect(
      options.plugins.zoom.pan.enabled
    ).toBeFalse();

    expect(
      options.plugins.zoom.pan.mode
    ).toBe('x');

    expect(
      options.plugins.zoom.pan.threshold
    ).toBe(4);

    expect(
      options.plugins.zoom.zoom.mode
    ).toBe('xy');

    expect(
      options.plugins.zoom.zoom.wheel.enabled
    ).toBeFalse();

    expect(
      options.plugins.zoom.zoom.pinch.enabled
    ).toBeTrue();
  });

  it('should execute onZoomComplete callback', () => {
    component.isZoomed = false;

    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    options.plugins.zoom.zoom.onZoomComplete();

    expect(component.isZoomed).toBeTrue();
  });

  it('should return timestamp from tooltip title callback', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    const titleCallback =
      options.plugins.tooltip.callbacks.title;

    const result = titleCallback([
      {
        dataIndex: 1
      }
    ]);

    expect(result).toContain('Timestamp:');
  });

  it('should return empty tooltip title for invalid index', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    const titleCallback =
      options.plugins.tooltip.callbacks.title;

    expect(
      titleCallback([
        {
          dataIndex: 999
        }
      ])
    ).toBe('');
  });

  it('should return empty tooltip title for empty items', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    const titleCallback =
      options.plugins.tooltip.callbacks.title;

    expect(titleCallback([])).toBe('');
  });

  it('should format tooltip value', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    const labelCallback =
      options.plugins.tooltip.callbacks.label;

    expect(
      labelCallback({
        parsed: {
          y: 12.3456
        }
      })
    ).toBe('Value: 12.3');
  });

  it('should show dash for missing tooltip value', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    const labelCallback =
      options.plugins.tooltip.callbacks.label;

    expect(
      labelCallback({
        parsed: {
          y: undefined
        }
      })
    ).toBe('Value: —');
  });

  it('should return tooltip unit', () => {
    const createConfiguration = (component as any)
      .createConfiguration
      .bind(component);

    const config = createConfiguration();

    const options = config.options as any;

    const afterLabelCallback =
      options.plugins.tooltip.callbacks.afterLabel;

    expect(
      afterLabelCallback()
    ).toBe('Unit: m/s');
  });

  it('should update chart data with fake chart', () => {
    const fakeChart: any = {
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            label: '',
            borderColor: '',
            backgroundColor: ''
          }
        ]
      },
      options: {
        color: '',
        scales: {
          x: {
            grid: {},
            ticks: {},
            title: {}
          },
          y: {
            grid: {},
            ticks: {},
            title: {}
          },
          extra: {}
        }
      },
      update: jasmine.createSpy('update'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;

    const updateChart = (component as any)
      .updateChart
      .bind(component);

    updateChart();

    expect(
      fakeChart.data.labels.length
    ).toBe(3);

    expect(
      fakeChart.data.datasets[0].data
    ).toEqual([100, 102.3, 105.6]);

    expect(
      fakeChart.data.datasets[0].label
    ).toBe('Velocity (m/s)');

    expect(
      fakeChart.data.datasets[0].borderColor
    ).toBe('#2673b8');

    expect(
      fakeChart.data.datasets[0].backgroundColor
    ).toBe('#2673b818');

    expect(
      fakeChart.options.color
    ).toBe('#66746e');

    expect(
      fakeChart.options.scales.x.grid.color
    ).toBe('#dce4df');

    expect(
      fakeChart.options.scales.x.ticks.color
    ).toBe('#66746e');

    expect(
      fakeChart.options.scales.y.grid.color
    ).toBe('#dce4df');

    expect(
      fakeChart.options.scales.y.ticks.color
    ).toBe('#66746e');

    expect(
      fakeChart.options.scales.y.title.text
    ).toBe('m/s');

    expect(
      fakeChart.options.scales.extra
    ).toEqual({});

    expect(
      fakeChart.update
    ).toHaveBeenCalledTimes(1);
  });

  it('should update chart using dark theme', () => {
    component.theme = 'dark';
    component.metricName = 'Temperature';
    component.unit = '°C';

    const fakeChart: any = {
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            label: '',
            borderColor: '',
            backgroundColor: ''
          }
        ]
      },
      options: {
        color: '',
        scales: {
          x: {
            grid: {},
            ticks: {},
            title: {}
          },
          y: {
            grid: {},
            ticks: {},
            title: {}
          }
        }
      },
      update: jasmine.createSpy('update'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;

    const updateChart = (component as any)
      .updateChart
      .bind(component);

    updateChart();

    expect(
      fakeChart.data.datasets[0].borderColor
    ).toBe('#ff8991');

    expect(
      fakeChart.data.datasets[0].backgroundColor
    ).toBe('#ff899124');

    expect(
      fakeChart.options.color
    ).toBe('#a7b5ae');

    expect(
      fakeChart.options.scales.y.title.text
    ).toBe('°C');

    expect(
      fakeChart.update
    ).toHaveBeenCalledTimes(1);
  });

  it('should safely return when updateChart has no chart', () => {
    (component as any).chart = undefined;

    const updateChart = (component as any)
      .updateChart
      .bind(component);

    expect(
      () => updateChart()
    ).not.toThrow();
  });

  it('should zoom in using fake chart', () => {
    const fakeChart: any = {
      zoom: jasmine.createSpy('zoom'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;

    component.zoomIn();

    expect(
      fakeChart.zoom
    ).toHaveBeenCalledWith(1.2);

    expect(component.isZoomed).toBeTrue();
  });

  it('should zoom out using fake chart', () => {
    const fakeChart: any = {
      zoom: jasmine.createSpy('zoom'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;

    component.zoomOut();

    expect(
      fakeChart.zoom
    ).toHaveBeenCalledWith(0.8);

    expect(component.isZoomed).toBeTrue();
  });

  it('should reset zoom using fake chart', () => {
    const fakeChart: any = {
      resetZoom: jasmine.createSpy('resetZoom'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;
    component.isZoomed = true;

    component.resetZoom();

    expect(
      fakeChart.resetZoom
    ).toHaveBeenCalledTimes(1);

    expect(component.isZoomed).toBeFalse();
  });

  it('should enable pan using fake chart', () => {
    const fakeChart: any = {
      options: {
        plugins: {
          zoom: {
            pan: {
              enabled: false
            }
          }
        }
      },
      update: jasmine.createSpy('update'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;

    component.togglePan();

    expect(component.panEnabled).toBeTrue();

    expect(
      fakeChart.options.plugins.zoom.pan.enabled
    ).toBeTrue();

    expect(
      fakeChart.update
    ).toHaveBeenCalledWith('none');
  });

  it('should disable pan using fake chart', () => {
    const fakeChart: any = {
      options: {
        plugins: {
          zoom: {
            pan: {
              enabled: true
            }
          }
        }
      },
      update: jasmine.createSpy('update'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;
    component.panEnabled = true;

    component.togglePan();

    expect(component.panEnabled).toBeFalse();

    expect(
      fakeChart.options.plugins.zoom.pan.enabled
    ).toBeFalse();

    expect(
      fakeChart.update
    ).toHaveBeenCalledWith('none');
  });

  it('should toggle pan safely when pan configuration is missing', () => {
    const fakeChart: any = {
      options: {
        plugins: {
          zoom: {}
        }
      },
      update: jasmine.createSpy('update'),
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;

    component.togglePan();

    expect(component.panEnabled).toBeTrue();

    expect(
      fakeChart.update
    ).not.toHaveBeenCalled();
  });

  it('should destroy fake chart', () => {
    const fakeChart: any = {
      destroy: jasmine.createSpy('destroy')
    };

    (component as any).chart = fakeChart;

    component.ngOnDestroy();

    expect(
      fakeChart.destroy
    ).toHaveBeenCalledTimes(1);

    expect(
      (component as any).destroyed
    ).toBeTrue();
  });

  it('should destroy safely when chart is undefined', () => {
    (component as any).chart = undefined;

    expect(
      () => component.ngOnDestroy()
    ).not.toThrow();

    expect(
      (component as any).destroyed
    ).toBeTrue();
  });

  it('should stop ngAfterViewInit when component is destroyed', async () => {
    (component as any).destroyed = true;
    (component as any).canvas = undefined;

    await component.ngAfterViewInit();

    expect(
      (component as any).chart
    ).toBeUndefined();

    expect(
      (component as any).destroyed
    ).toBeTrue();
  });

  it('should render visually hidden sample description', () => {
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    const hiddenText = element
      .querySelector('.visually-hidden')
      ?.textContent;

    expect(hiddenText).toContain(
      'Velocity line chart'
    );

    expect(hiddenText).toContain(
      'latest 3 timestamped samples'
    );
  });
});