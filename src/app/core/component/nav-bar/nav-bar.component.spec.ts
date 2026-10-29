import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { CoreModule } from '../../core.module';
import { NavBarComponent } from './nav-bar.component';

describe('NavBarComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule],
      providers: [provideRouter([])]
    });
  });

  it('abre e fecha o menu pelo botão (telas pequenas)', () => {
    const fixture = TestBed.createComponent(NavBarComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const toggler = element.querySelector<HTMLButtonElement>('.navbar-toggler');
    const menu = () => element.querySelector('.navbar-collapse');

    expect(menu().classList.contains('show')).toBe(false);
    expect(toggler.getAttribute('aria-expanded')).toBe('false');

    toggler.click();
    fixture.detectChanges();
    expect(menu().classList.contains('show')).toBe(true);
    expect(toggler.getAttribute('aria-expanded')).toBe('true');

    toggler.click();
    fixture.detectChanges();
    expect(menu().classList.contains('show')).toBe(false);
  });
});
