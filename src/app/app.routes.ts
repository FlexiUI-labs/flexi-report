import { Routes } from '@angular/router';
import { ReportComponent } from './report.component';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
    {
        path: "",
        component: LayoutComponent,
        children: [
            {
                path: "report/:type",
                component: ReportComponent
            },
            {
                path: "report/:type/:id",
                component: ReportComponent
            }
        ]
    }
];
