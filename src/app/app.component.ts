import { Component } from '@angular/core';
import { FlexiReportComponent } from '../../library/src/lib/flexi-report.component';

@Component({
  selector: 'app-root',
  imports: [FlexiReportComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'flexi-report';
}
