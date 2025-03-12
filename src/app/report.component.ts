import { ChangeDetectionStrategy, Component, computed, inject, resource, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { FlexiReportComponent } from '../../library/src/public-api';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ReportModel } from '../../library/src/lib/models/report.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from './report.service';

@Component({
  selector: 'app-report',
  imports: [FlexiReportComponent],
  template: `
  <flexi-report
      [report]="report()"
      [data]="data()"
      (onSave)="onSave($event)"
      [isPreview]="isPreview()"
      [editPath]="editPath()"
      (onNewReport)="onNewReport()"
      (onDelete)="onDelete($event)"/>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ReportComponent {
  readonly id = signal<string | undefined | null>(undefined);
  readonly editPath = computed(() => `/report/edit/${this.id()}`);
  readonly type = signal<string>("");

  readonly isPreview = computed(() => {
    if(!this.id()) return false;

    if(this.type() === "preview") return true;
    return false;
  });

  readonly reportResult = resource({
    request: this.id,
    loader: async () => {
      var res = await lastValueFrom(this.http.get<ReportModel>(`https://localhost:7032/${this.id()}`));
      return res;
    }
  });

  readonly report = computed(() => this.reportResult.value() ?? new ReportModel());
  readonly reportLoading = computed(() => this.reportResult.isLoading());

  readonly result = resource({
    loader: async () => {
      var res = await lastValueFrom(this.http.get<any[]>("https://jsonplaceholder.typicode.com/todos"));
      return res;
    }
  })
  readonly data = computed(() => this.result.value() ?? []);

  readonly http = inject(HttpClient);
  readonly activated = inject(ActivatedRoute);
  readonly #report = inject(ReportService);
  readonly router = inject(Router);

  constructor(){
    this.activated.params.subscribe(res => {
      this.id.set(res["id"]);
      this.type.set(res["type"]);
    });
  }

  onSave(report:any){
    this.http.post("https://localhost:7032",report).subscribe(() => this.#report.reportResult.reload());
  }

  onNewReport(){
    this.router.navigateByUrl("/report/edit");
  }

  onDelete(id:string){
    this.http.delete(`https://localhost:7032/${id}`).subscribe(() => {
      this.#report.reportResult.reload();
      this.router.navigateByUrl("/report/edit");
    });
  }
}
