import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ReportService } from '../report.service';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './layout.component.html'
})
export class LayoutComponent {
  readonly reports = computed(() => this.report.reports());
  readonly report = inject(ReportService);
}
