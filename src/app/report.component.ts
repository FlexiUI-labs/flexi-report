import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal, resource, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { FlexiReportComponent } from '../../library/src/public-api';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ReportModel } from '../../library/src/lib/models/report.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from './report.service';
import { FlexiToastService } from 'flexi-toast';

@Component({
  selector: 'app-report',
  imports: [FlexiReportComponent],
  template: `
  <flexi-report
      [report]="report()"
      [data]="data()"
      [loading]="loading()"
      [openAPIKey]="openAPIKey()"
      [isPreview]="isPreview()"
      [editPath]="editPath()"
      [sqlQueryLoading]="sqlQueryLoadingSignal()"
      [tablesData]="tablesData()"
      (onSave)="onSave($event)"
      (onNewReport)="onNewReport()"
      (onDelete)="onDelete($event)"
      (onEndpointChange)="onEndpointChange($event)"
      (onExecute)="onExecute($event)"
      />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ReportComponent {
  readonly id = signal<string | undefined | null>(undefined);
  readonly editPath = computed(() => `/report/edit/${this.id()}`);
  readonly type = signal<string>("");
  readonly endpoint = linkedSignal(() => this.reportResult.value()?.endpoint ?? "");
  readonly sqlQuery = linkedSignal(() => this.reportResult.value()?.sqlQuery ?? "");
  readonly openAPIKey = signal<string>("");

  readonly isPreview = computed(() => {
    if(!this.id()) return false;

    if(this.type() === "preview") return true;
    return false;
  });

  readonly reportResult = resource({
    request: this.id,
    loader: async () => {
      var res = await lastValueFrom(this.#http.get<ReportModel>(`https://localhost:7032/reports/${this.id()}`));
      return res;
    }
  });

  readonly report = linkedSignal(() => this.reportResult.value() ?? new ReportModel());
  readonly reportLoading = computed(() => this.reportResult.isLoading());

  readonly result = resource({
    request: this.endpoint,
    loader: async ({request}) => {
      var res = await lastValueFrom(this.#http.get<any>(request));
      return res;
    }
  })
  readonly data = linkedSignal(() => this.result.value() || this.sqlQueryResult.value() || []);
  readonly loading = computed(() => this.result.isLoading());

  readonly tablesResult = resource({
    loader: async ()=> {
      var res = await lastValueFrom(this.#http.get<any[]>("https://localhost:7032/database-schema"));
      return res;
    }
  })
  readonly tablesData = computed(() => this.tablesResult.value() || []);

  readonly sqlQueryResult = resource({
    request: ()=> this.sqlQuery(),
    loader: async ({request}) => {
      if(!request) return;
      const data = {
        sqlQuery: this.sqlQuery()
      }
      var res = await lastValueFrom(this.#http.post<any[]>("https://localhost:7032/execute-query", data));
      return res;
    }
  })
  readonly sqlQueryLoadingSignal = linkedSignal(() => this.sqlQueryResult.isLoading());

  readonly #http = inject(HttpClient);
  readonly #activated = inject(ActivatedRoute);
  readonly #report = inject(ReportService);
  readonly #router = inject(Router);
  readonly #toast = inject(FlexiToastService);

  constructor(){
    this.#activated.params.subscribe(res => {
      this.id.set(res["id"]);
      this.type.set(res["type"]);
    });
  }

  onSave(report:any){
    this.#http.post("https://localhost:7032/reports",report).subscribe((res:any) => {
      report.id = res.id;
      this.report.set(report);
      this.#report.reportResult.reload();
      this.#toast.showToast("Success","Rapor create was successful","success");
    });
  }

  onNewReport(){
    this.#router.navigateByUrl("/report/edit");
  }

  onDelete(id:string){
    this.#http.delete(`https://localhost:7032/reports/${id}`).subscribe(() => {
      this.#report.reportResult.reload();
      this.#router.navigateByUrl("/report/edit");
      this.#toast.showToast("Success","Rapor delete was successful","info");
    });
  }

  onEndpointChange(endpoint: string){
    this.endpoint.set(endpoint);
  }

  onExecute(sqlQuery:string){
    this.sqlQuery.set(sqlQuery);
  }
}
