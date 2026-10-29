import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of } from 'rxjs';

import { Course } from './course';
import { CourseListComponent } from './course-list.component';
import { CourseModule } from './course.module';
import { CourseService } from './course.service';

describe('CourseListComponent', () => {
  const courses = [
    { id: 1, name: 'Angular: CLI', code: 'XLF-1212', rating: 3, price: 1, releaseDate: 'November 2, 2019' },
    { id: 2, name: 'Angular: Forms', code: 'DWQ-3412', rating: 4, price: 2, releaseDate: 'November 4, 2019' }
  ] as Course[];

  let courseService: { retrieveAll: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    courseService = {
      retrieveAll: vi.fn(() => of(courses)),
      deleteById: vi.fn(() => of(undefined))
    };

    await TestBed.configureTestingModule({
      imports: [CourseModule],
      providers: [provideRouter([]), { provide: CourseService, useValue: courseService }]
    }).compileComponents();
  });

  it('renderiza os cursos e filtra pelo nome', () => {
    const fixture = TestBed.createComponent(CourseListComponent);
    fixture.detectChanges();

    const rows = () => fixture.nativeElement.querySelectorAll('tbody tr').length;
    expect(rows()).toBe(2);

    fixture.componentInstance.filter = 'forms';
    fixture.detectChanges();
    expect(rows()).toBe(1);
  });

  it('aplica os pipes lowercase e replace no código', () => {
    const fixture = TestBed.createComponent(CourseListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody tr td:nth-child(4)').textContent.trim()).toBe('xlf 1212');
  });

  it('exibe o botão Cadastrar e os botões Editar', () => {
    const fixture = TestBed.createComponent(CourseListComponent);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    const cadastrar = Array.from(element.querySelectorAll('a')).find(a => a.textContent.trim() === 'Cadastrar');
    expect(cadastrar?.getAttribute('href')).toBe('/course/new');

    const editar = Array.from(element.querySelectorAll('tbody a')).map(a => a.textContent.trim());
    expect(editar).toEqual(['Editar', 'Editar']);
  });

  it('deleteById recarrega a lista', () => {
    const fixture = TestBed.createComponent(CourseListComponent);
    fixture.detectChanges();

    fixture.componentInstance.deleteById(1);
    expect(courseService.deleteById).toHaveBeenCalledWith(1);
    expect(courseService.retrieveAll).toHaveBeenCalledTimes(2);
  });
});
