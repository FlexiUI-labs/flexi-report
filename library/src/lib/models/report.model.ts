import { RequestElementModel } from "./request-element.model";

export class ReportModel{
    id: string | null = null;
    content: string = "";
    createdAt: string = new Date().toString();
    name: string = "New Report";
    endpoint: string = "";
    pageSize: string = "a4";
    pageOrientation: "landscape" | "portrait" = "portrait";
    fontFamily: string = "Roboto";
    sqlQuery: string = "";
    requestElements: RequestElementModel[] = [];
}