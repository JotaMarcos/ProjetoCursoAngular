import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { Error404Component } from './core/component/error-404/error-404.component';

// Deve ser importado por último no AppModule: o wildcard '**' precisa ficar depois das rotas dos módulos de feature.
const routes: Routes = [
  { path: '', redirectTo: 'courses', pathMatch: 'full' },
  { path: '**', component: Error404Component }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
