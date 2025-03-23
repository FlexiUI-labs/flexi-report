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
            var req = await lastValueFrom(this.#http.get<any>(s.endpoint!));
            s.data = req;
          }
        });
      }

      const request: RequestModel = {
        endpoint: res.endpoint,
        sqlQuery: res.sqlQuery,
        params: {}
      }
      this.request.set(request);
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
        res = await lastValueFrom(this.#http.get<any>(endpoint, {
          headers: {
            Authorization: "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQxYmQ5NzRhLWY4YTUtNGJlOC00NTNjLTA4ZGQxMjNhNjg3OSIsIm5hbWUiOiJUYW5lciBTYXlkYW0iLCJlbWFpbCI6InRhbmVyc2F5ZGFtQGdtYWlsLmNvbSIsInVzZXJOYW1lIjoiYWRtaW4iLCJjb21wYW5pZXMiOiJbe1wiaWRcIjpcIjNiY2MyNzNiLTgyZmEtNGYzYi04MTI2LTFiZmJhYjg4N2VjNlwiLFwibmFtZVwiOlwiVGVzdCBDb21wYW55IDFcIixcInNob3J0TmFtZVwiOlwidGVzdDFcIixcInN1YmVsZXJcIjpbe1wiaWRcIjpcIjJlOGUwOGIyLThkNDEtNDRkMC1iMDNjLTExNTczNjNlYThhNFwiLFwiY29tcGFueVwiOntcImlkXCI6XCIzYmNjMjczYi04MmZhLTRmM2ItODEyNi0xYmZiYWI4ODdlYzZcIixcIm5hbWVcIjpcIlRlc3QgQ29tcGFueSAxXCIsXCJzaG9ydE5hbWVcIjpcInRlc3QxXCIsXCJhZGRyZXNzXCI6e1wiQ291bnRyeVwiOlwiVFxcdTAwRkNya2l5ZVwiLFwiQ2l0eVwiOm51bGwsXCJUb3duXCI6bnVsbCxcIkZ1bGxBZGRyZXNzXCI6bnVsbCxcIlBob25lTnVtYmVyMVwiOm51bGwsXCJQaG9uZU51bWJlcjJcIjpudWxsLFwiRW1haWxcIjpudWxsfX0sXCJjb21wYW55SWRcIjpcIjNiY2MyNzNiLTgyZmEtNGYzYi04MTI2LTFiZmJhYjg4N2VjNlwiLFwibmFtZVwiOlwiTWVya2V6XCIsXCJzaG9ydE5hbWVcIjpcIm1lcmtlelwiLFwiaXNTZWxlY3RlZFwiOnRydWUsXCJ5ZWFyc1wiOlsyMDI1XSxcInNlbGVjdGVkWWVhclwiOjIwMjV9LHtcImlkXCI6XCI0MGE2MzE5ZS1kYzAxLTQ5MDEtYjNkYi1hMjQwODE3ZGMwMzVcIixcImNvbXBhbnlcIjp7XCJpZFwiOlwiM2JjYzI3M2ItODJmYS00ZjNiLTgxMjYtMWJmYmFiODg3ZWM2XCIsXCJuYW1lXCI6XCJUZXN0IENvbXBhbnkgMVwiLFwic2hvcnROYW1lXCI6XCJ0ZXN0MVwiLFwiYWRkcmVzc1wiOntcIkNvdW50cnlcIjpcIlRcXHUwMEZDcmtpeWVcIixcIkNpdHlcIjpudWxsLFwiVG93blwiOm51bGwsXCJGdWxsQWRkcmVzc1wiOm51bGwsXCJQaG9uZU51bWJlcjFcIjpudWxsLFwiUGhvbmVOdW1iZXIyXCI6bnVsbCxcIkVtYWlsXCI6bnVsbH19LFwiY29tcGFueUlkXCI6XCIzYmNjMjczYi04MmZhLTRmM2ItODEyNi0xYmZiYWI4ODdlYzZcIixcIm5hbWVcIjpcIk91dGxldFwiLFwic2hvcnROYW1lXCI6XCJvdXRsZXRcIixcImlzU2VsZWN0ZWRcIjpmYWxzZSxcInllYXJzXCI6WzIwMjVdLFwic2VsZWN0ZWRZZWFyXCI6MjAyNX1dfSx7XCJpZFwiOlwiMjU5YjVmYjMtMTY3MS00M2M4LTlhMDUtODBmZWI1MzdhMWFjXCIsXCJuYW1lXCI6XCJUZXN0IENvbXBhbnkgMlwiLFwic2hvcnROYW1lXCI6XCJ0ZXN0MlwiLFwic3ViZWxlclwiOlt7XCJpZFwiOlwiOTJjZWVjMzQtNWY5Zi00MmU1LWFlZWYtYjQ2YjUzZWU4NDQ4XCIsXCJjb21wYW55XCI6e1wiaWRcIjpcIjI1OWI1ZmIzLTE2NzEtNDNjOC05YTA1LTgwZmViNTM3YTFhY1wiLFwibmFtZVwiOlwiVGVzdCBDb21wYW55IDJcIixcInNob3J0TmFtZVwiOlwidGVzdDJcIixcImFkZHJlc3NcIjp7XCJDb3VudHJ5XCI6XCJUXFx1MDBGQ3JraXllXCIsXCJDaXR5XCI6bnVsbCxcIlRvd25cIjpudWxsLFwiRnVsbEFkZHJlc3NcIjpudWxsLFwiUGhvbmVOdW1iZXIxXCI6bnVsbCxcIlBob25lTnVtYmVyMlwiOm51bGwsXCJFbWFpbFwiOm51bGx9fSxcImNvbXBhbnlJZFwiOlwiMjU5YjVmYjMtMTY3MS00M2M4LTlhMDUtODBmZWI1MzdhMWFjXCIsXCJuYW1lXCI6XCJNZXJrZXpcIixcInNob3J0TmFtZVwiOlwibWVya2V6XCIsXCJpc1NlbGVjdGVkXCI6ZmFsc2UsXCJ5ZWFyc1wiOlsyMDI1XSxcInNlbGVjdGVkWWVhclwiOjIwMjV9LHtcImlkXCI6XCIwNGUyMDlkNC1hOTFiLTQ2NjYtODAzNC1hYjUzZjc3OWI4NTdcIixcImNvbXBhbnlcIjp7XCJpZFwiOlwiMjU5YjVmYjMtMTY3MS00M2M4LTlhMDUtODBmZWI1MzdhMWFjXCIsXCJuYW1lXCI6XCJUZXN0IENvbXBhbnkgMlwiLFwic2hvcnROYW1lXCI6XCJ0ZXN0MlwiLFwiYWRkcmVzc1wiOntcIkNvdW50cnlcIjpcIlRcXHUwMEZDcmtpeWVcIixcIkNpdHlcIjpudWxsLFwiVG93blwiOm51bGwsXCJGdWxsQWRkcmVzc1wiOm51bGwsXCJQaG9uZU51bWJlcjFcIjpudWxsLFwiUGhvbmVOdW1iZXIyXCI6bnVsbCxcIkVtYWlsXCI6bnVsbH19LFwiY29tcGFueUlkXCI6XCIyNTliNWZiMy0xNjcxLTQzYzgtOWEwNS04MGZlYjUzN2ExYWNcIixcIm5hbWVcIjpcIlNhbmF5aSBNYVxcdTAxMUZhemFcIixcInNob3J0TmFtZVwiOlwic2FuYXlpXCIsXCJpc1NlbGVjdGVkXCI6ZmFsc2UsXCJ5ZWFyc1wiOlsyMDI1XSxcInNlbGVjdGVkWWVhclwiOjIwMjV9XX1dIiwiY29tcGFueUlkIjoiM2JjYzI3M2ItODJmYS00ZjNiLTgxMjYtMWJmYmFiODg3ZWM2Iiwic3ViZSI6IntcImlkXCI6XCIyZThlMDhiMi04ZDQxLTQ0ZDAtYjAzYy0xMTU3MzYzZWE4YTRcIixcImNvbXBhbnlcIjp7XCJpZFwiOlwiM2JjYzI3M2ItODJmYS00ZjNiLTgxMjYtMWJmYmFiODg3ZWM2XCIsXCJuYW1lXCI6XCJUZXN0IENvbXBhbnkgMVwiLFwic2hvcnROYW1lXCI6XCJ0ZXN0MVwiLFwiYWRkcmVzc1wiOntcIkNvdW50cnlcIjpcIlRcXHUwMEZDcmtpeWVcIixcIkNpdHlcIjpudWxsLFwiVG93blwiOm51bGwsXCJGdWxsQWRkcmVzc1wiOm51bGwsXCJQaG9uZU51bWJlcjFcIjpudWxsLFwiUGhvbmVOdW1iZXIyXCI6bnVsbCxcIkVtYWlsXCI6bnVsbH19LFwiY29tcGFueUlkXCI6XCIzYmNjMjczYi04MmZhLTRmM2ItODEyNi0xYmZiYWI4ODdlYzZcIixcIm5hbWVcIjpcIk1lcmtlelwiLFwic2hvcnROYW1lXCI6XCJtZXJrZXpcIixcImlzU2VsZWN0ZWRcIjp0cnVlLFwieWVhcnNcIjpbMjAyNV0sXCJzZWxlY3RlZFllYXJcIjoyMDI1fSIsInN1YmVJZCI6IjJlOGUwOGIyLThkNDEtNDRkMC1iMDNjLTExNTczNjNlYThhNCIsInllYXIiOiIyMDI1IiwiYXZhdGFyIjoiMjQucG5nIiwidXNlci1yb2xlcyI6IntcInJvbGVcIjpcIkFkbWluXCJ9IiwibmJmIjoxNzQyNjUxODE2LCJleHAiOjE3NDI3MzgyMTYsImlzcyI6Ik1lIiwiYXVkIjoiTXkgUHJvamVjdHMifQ.lZD8pbmwuqf0SeMnm97NbczIhpqMZmqGYIdBzcI9jK7qhdC__GK5VxdD8dTHtAHkipZniDfycuDGGSb_qhdsEw",
            companyid: "3bcc273b-82fa-4f3b-8126-1bfbab887ec6",
            year: "2025"
          }
        }));
      }

      return res.data!;
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
