import { computed, inject, Injectable, resource, signal } from '@angular/core';
import { ReportModel } from '../../library/src/lib/models/report.model';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  readonly reports = computed(() => this.reportResult.value() ?? []);
  readonly reportResult = resource({
    loader: async () => {
      var res = await lastValueFrom(this.http.get<ReportModel[]>(`https://localhost:7032/api/reports`));
      return res;
    }
  });

  readonly http = inject(HttpClient);
}
