import { Component } from '@angular/core';

@Component({
  selector: 'app-nav-bar',
  templateUrl: './nav-bar.component.html',
  standalone: false
})

export class NavBarComponent {
  // Controla o menu em telas pequenas sem depender do JavaScript do Bootstrap.
  collapsed = true;
}
