import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('renders dashboard navigation and theme controls', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    const header = fixture.nativeElement as HTMLElement;

    expect(header.querySelector('a[href="/"]')).not.toBeNull();
    expect(header.querySelector('a[href="/trends"]')).not.toBeNull();
    expect(header.querySelector('[aria-label="Color theme"]')).not.toBeNull();
  });

  it('emits theme and refresh actions to the app shell', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    const themes: string[] = [];
    let refreshRequested = false;
    fixture.componentInstance.themeChange.subscribe((theme) => themes.push(theme));
    fixture.componentInstance.refresh.subscribe(() => refreshRequested = true);
    fixture.detectChanges();
    const header = fixture.nativeElement as HTMLElement;

    (header.querySelector('.theme-option:last-child') as HTMLButtonElement).click();
    (header.querySelector('.refresh-button') as HTMLButtonElement).click();

    expect(themes).toEqual(['dark']);
    expect(refreshRequested).toBeTrue();
  });
});