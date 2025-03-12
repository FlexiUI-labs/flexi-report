import { AfterViewInit, Component, computed, inject, resource, viewChild } from '@angular/core';
import { FlexiReportComponent } from '../../library/src/lib/flexi-report.component';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  imports: [FlexiReportComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  readonly result = resource({
    request: () => this.report()?.endpoint(),
    loader: async ({request}) => {
      if(!request) return;
      console.log(request);

      var res = await lastValueFrom(this.http.get<any[]>(request));
      return res;
    }
  })
  readonly data = computed(() => this.result.value() ?? []);

  readonly report = viewChild(FlexiReportComponent);

  readonly http = inject(HttpClient);
}
