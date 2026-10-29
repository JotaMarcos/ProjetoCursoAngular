import { StarComponent } from './star.component';

describe('StarComponent', () => {
  it('calcula a largura proporcional à nota', () => {
    const component = new StarComponent();
    component.rating = 5;
    component.ngOnChanges();
    expect(component.starWidth).toBe(74);

    component.rating = 2.5;
    component.ngOnChanges();
    expect(component.starWidth).toBe(37);
  });
});
