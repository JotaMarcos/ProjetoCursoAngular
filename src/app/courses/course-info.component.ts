import {
  Component,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Course } from './course';
import { CourseService } from './course.service';

@Component({
  templateUrl: './course-info.component.html',
  standalone: false
})
export class CourseInfoComponent implements OnInit {
  course: Course;
  constructor(private activatedRoute: ActivatedRoute, private router: Router, private courseService: CourseService){}
  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');

    // Sem id na rota (/course/new): formulário vazio para cadastro.
    if (!id) {
      this.course = new Course();
      return;
    }

    this.courseService.retrieveById(Number(id)).subscribe({
      next: course => this.course = course,
      error: err => console.log('Error', err)
    });
  }

  save(): void {
    this.courseService.save(this.course).subscribe({
      next: course => {
        console.log('Saved with sucess', course);
        this.router.navigate(['/courses']);
      },
      error: err => console.log('Error', err)
    });
  }

}
