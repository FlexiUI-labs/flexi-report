import { computed, Injectable, signal } from '@angular/core';
import { ElementStyleModel, initializeElementStyle } from '../models/element-style.model';
import { iconNames } from '../icon-names';

@Injectable({
  providedIn: 'root'
})
export class StyleService {
  readonly selectedElement = signal<HTMLElement | null>(null);
  readonly elementStyle = signal<ElementStyleModel>(initializeElementStyle);
  readonly elementType = computed(() => this.selectedElement()?.tagName || "");
  readonly elementName = computed(() => this.selectedElement()?.getAttribute("data-name") || this.selectedElement()?.tagName || "");
  readonly fontFamilies = signal<string[]>([
    "Roboto",
    // "Arial",
    // "Times New Roman",
    // "Oswald",
    // "IBM Plex Sans"
  ]);
  readonly textDecorations = signal<string[]>([
    "none",
    "underline",
    "dashed",
    "dotted",
    "double",
    "line-through",
    "overline",
    "solid",
    "wavy"
  ]);
  readonly borderStles = signal<string[]>([
    "unset",
    "dashed",
    "dotted",
    "double",
    "groove",
    "hidden",
    "inherit",
    "initial",
    "inset",
    "none",
    "outset",
    "ridge",
    "solid"
  ]);
  readonly objectFits = signal<string[]>([
    "unset",
    "cover",
    "contain",
    "fill",
    "none",
    "scale-down"
  ]);
  readonly iconNames = signal<string[]>(iconNames);

  changeElementText() {
    this.selectedElement()!.innerText = this.elementStyle().text;
    this.selectedElement()!.setAttribute("data-value", this.elementStyle().text);
  }

  changeElementWith() {
    this.selectedElement()!.style.width = this.elementStyle().width;
  }

  changeElementHeight(){
    this.selectedElement()!.style.height = this.elementStyle().height!;
  }

  changeElementObjectFit(){
    this.selectedElement()!.style.objectFit = this.elementStyle().objectFit!;
  }

  changeElementTextAlign() {
    this.selectedElement()!.style.textAlign = this.elementStyle().textAlign!;
  }

  changeElementBorder() {
    if (this.elementStyle().borderWidth) {
      this.selectedElement()!.style.borderWidth = this.elementStyle().borderWidth!;
    }

    if (this.elementStyle().borderStyle) {
      this.selectedElement()!.style.borderStyle = this.elementStyle().borderStyle!;
    }

    if (this.elementStyle().borderColor) {
      this.selectedElement()!.style.borderColor = this.elementStyle().borderColor!;
    }

    if (this.elementStyle().borderRadius) {
      this.selectedElement()!.style.borderRadius = this.elementStyle().borderRadius!;
    }
  }

  changeElementFontSize() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.fontSize = this.elementStyle().fontSize!;
    }
  }

  changeElementFontFamily() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.fontFamily = this.elementStyle().fontFamily!;
    }
  }

  changeElementFontWeight() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.fontWeight = this.elementStyle().fontWeight!;
    }
  }

  changeElementTextDecoration() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.textDecoration = this.elementStyle().textDecoration!;
    }
  }

  changeElementTextColor() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.color = this.elementStyle().color!;
    }
  }

  changeElementBackgroundColor() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.backgroundColor = this.elementStyle().backgroundColor!;
    }
  }

  changeElementPadding() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.padding = this.elementStyle().padding!;
    }
  }

  changeElementMargin() {
    if (this.selectedElement()) {
      this.selectedElement()!.style.margin = this.elementStyle().margin!;
    }
  }

  changeTableBorder() {
    const ths = this.selectedElement()?.querySelectorAll("th");
    const tds = this.selectedElement()?.querySelectorAll("td");

    ths?.forEach(el => {
      el.style.borderWidth = this.elementStyle().thBorderWidth || "0px";
      el.style.borderStyle = this.elementStyle().thBorderStyle || "unset";
      el.style.borderColor = this.elementStyle().thBorderColor || "black";
    })

    tds?.forEach(el => {
      el.style.borderWidth = this.elementStyle().tdBorderWidth || "0px";
      el.style.borderStyle = this.elementStyle().tdBorderStyle || "unset";
      el.style.borderColor = this.elementStyle().tdBorderColor || "black";
    })
  }

  changeTableFontSize() {
    const ths = this.selectedElement()?.querySelectorAll("th");
    const tds = this.selectedElement()?.querySelectorAll("td");

    ths?.forEach(el => {
      el.style.fontSize = this.elementStyle().thFontSize || el.style.fontSize || "11px";
    });

    tds?.forEach(el => {
      el.style.fontSize = this.elementStyle().tdFontSize || el.style.fontSize || "10px";
    });
  }

  showFooter(){
    const dataset = this.selectedElement()?.dataset;
    return dataset && dataset["showFooter"] === "true";
  }

  changeShowFooter(event:any){
    this.selectedElement()!.setAttribute("data-show-footer", event.target.checked.toString());
  }

  selectImage(event:any){
    const file = event.target.files[0];
    if (file) {
      const el = this.selectedElement() as HTMLImageElement;
      const reader = new FileReader();
      reader.onload = () => el.src = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  changeElementTHWith(){
    const ths = this.selectedElement()?.querySelectorAll("th");
    ths?.forEach(el => {
      el.style.width = this.elementStyle().thWidth || "auto";
    });
  }

  changeElementTDWith(){
    const tds = this.selectedElement()?.querySelectorAll("td");
    tds?.forEach(el => {
      el.style.width = this.elementStyle().tdWidth || "auto";
    });
  }

  changeElTRBorder(){
    const trs = this.selectedElement()?.querySelectorAll("th,td") as NodeListOf<HTMLElement>;
    trs?.forEach(el => {
      el.style.borderWidth = this.elementStyle().trBorderWidth || "1px";
      el.style.borderStyle = this.elementStyle().trBorderStyle || "solid";
      el.style.borderColor = this.elementStyle().trBorderColor || "black";
    });
  }
}
