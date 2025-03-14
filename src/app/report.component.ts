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

  readonly dataResult = resource({
    request: this.request,
    loader: async({request}) => {
      let res:any;
      if(request.sqlQuery){
        res = await lastValueFrom(this.#http.post<any[]>("https://localhost:7032/execute-query", request));
        return res;
      }else if(request.endpoint){
        const endpoint = request.endpoint;

        res = await lastValueFrom(this.#http.post<any>(endpoint, request.params));
        return res;
      }

      return;
    }
  })
  readonly data = linkedSignal(() => this.dataResult.value());
  readonly loading = computed(() => this.dataResult.isLoading());
  readonly sqlQueryLoadingSignal = linkedSignal(() => this.request().sqlQuery ? this.dataResult.isLoading() : false);

  readonly tablesResult = resource({
    request: this.type,
    loader: async ({request})=> {
      if(request === "preview") return;
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

  constructor(){
    this.#activated.params.subscribe(res => {
      this.id.set(res["id"]);
      this.type.set(res["type"]);
    });
  }

  onSave(report:any){
    this.#http.post<any>("https://localhost:7032/reports",report).subscribe((res:any) => {
      report.id = res.data;
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

  onExecute(data:any){
    this.request.set(data);
  }
}
