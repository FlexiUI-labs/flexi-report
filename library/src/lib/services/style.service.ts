import { computed, Injectable, signal } from '@angular/core';
import { ElementStyleModel, initializeElementStyle } from '../models/element-style.model';

@Injectable({
  providedIn: 'root'
})
export class StyleService {
  readonly selectedElement = signal<HTMLElement | null>(null);
  readonly elementStyle = signal<ElementStyleModel>(initializeElementStyle);
  readonly elementType = computed(() => this.selectedElement()?.tagName ?? "");

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
    if(this.elementStyle().borderWidth){
      this.selectedElement()!.style.borderWidth = this.elementStyle().borderWidth!;
    }

    if(this.elementStyle().borderStyle){
      this.selectedElement()!.style.borderStyle = this.elementStyle().borderStyle!;
    }

    if(this.elementStyle().borderColor){
      this.selectedElement()!.style.borderColor = this.elementStyle().borderColor!;
    }
  }

  changeElementFontSize() {
    if(this.selectedElement()){
      this.selectedElement()!.style.fontSize = this.elementStyle().fontSize!;
    }
  }

  changeElementFontFamily() {
    if(this.selectedElement()){
      this.selectedElement()!.style.fontFamily = this.elementStyle().fontFamily!;
    }
  }

  changeElementTextColor() {
    if(this.selectedElement()){
      this.selectedElement()!.style.color = this.elementStyle().color!;
    }
  }

  changeElementBackgroundColor() {
    if(this.selectedElement()){
      this.selectedElement()!.style.backgroundColor = this.elementStyle().backgroundColor!;
    }
  }

  changeElementPadding() {
    if(this.selectedElement()){
      this.selectedElement()!.style.padding = this.elementStyle().padding!;
    }
  }

  changeElementMargin() {
    if(this.selectedElement()){
      this.selectedElement()!.style.margin = this.elementStyle().margin!;
    }
  }

  changeElementBorderRadius() {
    if(this.selectedElement()){
      this.selectedElement()!.style.borderRadius = this.elementStyle().borderRadius!;
    }
  }
}
