import { Component, computed, inject, resource } from '@angular/core';
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
    loader: async () => {
      var res = await lastValueFrom(this.http.get<any[]>("https://jsonplaceholder.typicode.com/todos"));
      return res;
    }
  })
  readonly data = computed(() => this.result.value() ?? []);

  readonly http = inject(HttpClient);

}
