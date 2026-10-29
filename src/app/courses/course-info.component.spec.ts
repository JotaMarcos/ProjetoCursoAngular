import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';

import { of } from 'rxjs';

import { Course } from './course';
import { CourseInfoComponent } from './course-info.component';
import { CourseModule } from './course.module';
import { CourseService } from './course.service';

describe('CourseInfoComponent', () => {
  let courseService: { retrieveById: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };

  const setup = (id: string | null) => {
    courseService = {
      retrieveById: vi.fn(() => of({ id: 2, name: 'Angular: Forms' } as Course)),
      save: vi.fn((course: Course) => of({ ...course, id: course.id ?? 6 }))
    };

    TestBed.configureTestingModule({
      imports: [CourseModule],
      providers: [
        provideRouter([]),
        { provide: CourseService, useValue: courseService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }
      ]
    });

    const fixture = TestBed.createComponent(CourseInfoComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('em /course/new abre o formulário vazio sem consultar a API', () => {
    const fixture = setup(null);

    expect(courseService.retrieveById).not.toHaveBeenCalled();
    expect(fixture.componentInstance.course.id).toBeUndefined();
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Cadastrar Curso');
  });

  it('em /course/info/:id carrega o curso para edição', () => {
    const fixture = setup('2');

    expect(courseService.retrieveById).toHaveBeenCalledWith(2);
    expect(fixture.componentInstance.course.name).toBe('Angular: Forms');
  });

  it('salvar um novo curso volta para a lista', () => {
    const fixture = setup(null);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture.componentInstance.course = { name: 'Novo', description: 'd', price: 1, rating: 3 } as Course;
    fixture.componentInstance.save();

    expect(courseService.save).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/courses']);
  });
});
