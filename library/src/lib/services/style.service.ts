import { computed, Injectable, signal } from '@angular/core';
import { ElementStyleModel, initializeElementStyle } from '../models/element-style.model';

@Injectable({
  providedIn: 'root'
})
export class StyleService {
  readonly selectedElement = signal<HTMLElement | null>(null);
  readonly elementStyle = signal<ElementStyleModel>(initializeElementStyle);
  readonly elementType = computed(() => this.selectedElement()?.tagName ?? "");
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
  changeElementText() {
    this.selectedElement()!.innerText = this.elementStyle().text;
  }

  changeElementWith() {
    this.selectedElement()!.style.width = this.elementStyle().width;
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
      el.style.fontSize = this.elementStyle().thFontSize || "16px";
    });

    tds?.forEach(el => {
      el.style.fontSize = this.elementStyle().tdFontSize || "14px";
    });
  }
}
