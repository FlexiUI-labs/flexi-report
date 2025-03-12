import { Routes } from '@angular/router';
import { ReportComponent } from './report.component';

export const routes: Routes = [
    {
        path: "report/:type",
        component: ReportComponent
    },
    {
        path: "report/:type/:id",
        component: ReportComponent
    },
];
