import {
  Component,
  OnInit
} from '@angular/core';

import { Course } from './course';
import { CourseService } from './course.service';

@Component({
  templateUrl: './course-list.component.html',
  standalone: false
})

export class CourseListComponent implements OnInit {

  filteredCourses: Course[] = [];

  _courses: Course[] = [];

  _filterBy: string = '';

  constructor(private courseService: CourseService) { }

  ngOnInit(): void {
    this.retrieveAll();
  }

  retrieveAll(): void {
    this.courseService.retrieveAll().subscribe({
      next: courses => {
        this._courses = courses;
        this.applyFilter();
      },
      error: err => console.log('Error', err)
    });
  }

  deleteById(courseId: number): void {
    this.courseService.deleteById(courseId).subscribe({
      next: () => {
        console.log('Deleted with sucess');
        this.retrieveAll();
      },
      error: err => console.log('Error', err)
    });
  }


  set filter(value: string) {
    this._filterBy = value ?? '';
    this.applyFilter();
  }

  get filter(): string {
      return this._filterBy;
  }

  private applyFilter(): void {
    const filterBy = this._filterBy.toLocaleLowerCase();
    this.filteredCourses = this._courses.filter((course: Course) => (course.name ?? '').toLocaleLowerCase().includes(filterBy));
  }

}
