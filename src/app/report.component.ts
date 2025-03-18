import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, resource, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { FlexiReportComponent } from '../../library/src/public-api';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ReportModel } from '../../library/src/lib/models/report.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from './report.service';
import { FlexiToastService } from 'flexi-toast';
import { RequestModel } from '../../library/src/lib/models/request.model';

@Component({
  selector: 'app-report',
  imports: [FlexiReportComponent],
  template: `
  <flexi-report
    [data]="data()"
      [report]="report()"
      [loading]="loading()"
      [openAPIKey]="openAPIKey()"
      [isPreview]="isPreview()"
      [sqlQueryLoading]="sqlQueryLoadingSignal()"
      [tablesData]="tablesData()"
      [tablesData]="databaseSchema()"
      (onSave)="onSave($event)"
      (onEdit)="onEdit($event)"
      (onUpdate)="onUpdate($event)"
      (onDelete)="onDelete($event)"
      (onNewReport)="onNewReport()"
      (onSendRequest)="onExecute($event)"
      />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ReportComponent {
  readonly id = signal<string | undefined | null>(undefined);
  readonly editPath = computed(() => `/report/edit/${this.id()}`);
  readonly type = signal<string>("");
  readonly openAPIKey = signal<string>("");
  readonly request = signal<RequestModel>(new RequestModel());
  readonly databaseSchema = signal<any[]>([]);

  readonly isPreview = computed(() => {
    if (!this.id()) return false;

    if (this.type() === "preview") return true;
    return false;
  });

  readonly reportResult = resource({
    request: this.id,
    loader: async () => {
      var res = await lastValueFrom(this.#http.get<ReportModel>(`https://localhost:7032/api/reports/${this.id()}`));
      if (res.requestElements !== null && res.requestElements!.length > 0) {
        const selects = res.requestElements!.filter(p => p.type === "select");
        selects.forEach(async (s) => {
          if (s.endpoint) {
            var req = await lastValueFrom(this.#http.post<any[]>(s.endpoint!, {}));
            s.data = req;
          }
        });
      }
      return res;
    }
  });

  readonly report = linkedSignal(() => this.reportResult.value() ?? new ReportModel());
  readonly reportLoading = computed(() => this.reportResult.isLoading());

  readonly dataResult = resource({
    request: this.request,
    loader: async ({ request }) => {
      let res: any;
      if (request.sqlQuery) {
        res = await lastValueFrom(this.#http.post<any[]>("https://localhost:7032/execute-query", request));
      } else if (request.endpoint) {
        const endpoint = request.endpoint;
        res = await lastValueFrom(this.#http.post<any>(endpoint, request.params, {
          headers: {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJUQU5FUiBTQVlEQU0iLCJlbWFpbCI6InRhbmVyc2F5ZGFtQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2F1dGhlbnRpY2F0aW9uIjoiZjM5ZjA5MTctMWNmZi00MmI4LWIxOTQtNmYxNDk0ZjYzZmI5IiwiQ29tcGFueUlkIjoiN2JmNTYzZGEtNTE2Ni00MGJhLWE4NjEtMWJjNTQ4YTFhNjA5IiwibmJmIjoxNzQxODEzNjE3LCJleHAiOjE3NDQ0OTIwMTcsImlzcyI6Ind3dy5teXNpdGVtLmNvbSIsImF1ZCI6Ind3dy55b3Vyc2l0ZS5jb20ifQ.hXkR9FDiF_b_dktUGpEeJQcuCWSQ8D64hYwBRUcvuRg",
            "year": "2025"
          }
        }));
      }

      return res;
    }
  })
  readonly data = linkedSignal(() => this.dataResult.value());
  readonly loading = computed(() => this.dataResult.isLoading());
  readonly sqlQueryLoadingSignal = linkedSignal(() => this.request().sqlQuery ? this.dataResult.isLoading() : false);

  readonly tablesResult = resource({
    request: this.type,
    loader: async ({ request }) => {
      if (request === "preview") return;
      var res = await lastValueFrom(this.#http.get<any[]>("https://localhost:7032/database-schema"));
      return res;
    }
  })
  readonly tablesData = computed(() => this.tablesResult.value() || []);

  readonly #http = inject(HttpClient);
  readonly #activated = inject(ActivatedRoute);
  readonly #report = inject(ReportService);
  readonly #router = inject(Router);
  readonly #toast = inject(FlexiToastService);

  constructor() {
    this.#activated.params.subscribe(res => {
      this.id.set(res["id"]);
      this.type.set(res["type"]);
    });
  }

  onSave(report: any) {
    this.#http.post<any>("https://localhost:7032/api/reports", report).subscribe((res: any) => {
      report.id = res.data;
      this.report.set(report);
      this.#report.reportResult.reload();
      this.#toast.showToast("Success", "Rapor create was successful", "success");
    });
  }

  onUpdate(report: any) {
    this.#http.put<any>("https://localhost:7032/api/reports", report).subscribe((res: any) => {
      this.report.set(report);
      this.#report.reportResult.reload();
      this.#toast.showToast("Success", "Rapor update was successful", "success");
    });
  }

  onNewReport() {
    this.#router.navigateByUrl("/report/edit");
  }

  onDelete(id: string) {
    this.#http.delete(`https://localhost:7032/api/reports/${id}`).subscribe(() => {
      this.#report.reportResult.reload();
      this.#router.navigateByUrl("/report/edit");
      this.#toast.showToast("Success", "Rapor delete was successful", "info");
    });
  }

  onExecute(data: any) {
    this.request.set(data);
  }

  onEdit(id: any) {
    console.log(id);
    this.#router.navigateByUrl(this.editPath())
  }
}
