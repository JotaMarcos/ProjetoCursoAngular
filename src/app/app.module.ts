import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { NgModule, provideZoneChangeDetection } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { CourseModule } from './courses/course.module';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    CourseModule,
    CoreModule,
    AppRoutingModule
  ],
  providers: [
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptorsFromDi())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
