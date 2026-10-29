import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Course } from './course';
import { CourseService } from './course.service';

describe('CourseService', () => {
  const url = `${environment.apiUrl}/courses`;
  let service: CourseService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(CourseService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('retrieveAll faz GET na lista', () => {
    service.retrieveAll().subscribe(courses => expect(courses.length).toBe(1));
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);
  });

  it('save usa PUT quando o curso tem id', () => {
    service.save({ id: 3, name: 'x' } as Course).subscribe();
    const req = http.expectOne(`${url}/3`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('save usa POST quando o curso não tem id', () => {
    service.save({ name: 'x' } as Course).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('deleteById faz DELETE', () => {
    service.deleteById(2).subscribe();
    const req = http.expectOne(`${url}/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
