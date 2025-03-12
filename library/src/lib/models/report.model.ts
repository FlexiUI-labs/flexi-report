export class ReportModel{
    id: string | null = null;
    content: string = "";
    createdAt: string = new Date().toString();
    name: string = "New Report";
    endpoint: string = "https://jsonplaceholder.typicode.com/todos";
}