export interface TableSettingModel {
  value: string;
  width: string;
  property?: string;
  textAlign?: string;
  format?: string;
  footerValue?: string;
  calculation?:string;
  el?: HTMLElement;
}