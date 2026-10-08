import { TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  it('renders the application identity and local telemetry label', async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent]
    }).compileComponents();
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Compressor Operations');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Local telemetry monitoring');
  });
});