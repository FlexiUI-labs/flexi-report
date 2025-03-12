import { AfterViewInit, Component, computed, inject, resource, viewChild } from '@angular/core';
import { FlexiReportComponent } from '../../library/src/lib/flexi-report.component';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FlexiButtonComponent } from 'flexi-button';
import { ReportService } from './report.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, FlexiButtonComponent],
  template: `
  <div style="display: flex; gap:5px">
    <flexi-button btnColor="primary" btnText="Report Page" routerLink="/report/edit" btnIcon="lab_profile" />
    @for(val of reports(); track val.id){
      <flexi-button btnColor="primary" [btnText]="val.name" routerLink="/report/preview/{{val.id}}" btnIcon="gallery_thumbnail" />
    }
  </div>
  <router-outlet />
  `
})
export class AppComponent {
  readonly reports = computed(() => this.report.reports());
  readonly report = inject(ReportService);
}
