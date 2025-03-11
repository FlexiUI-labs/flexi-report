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
}
