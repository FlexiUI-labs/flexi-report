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
    this.selectedElement()!.style.textAlign = this.elementStyle().textAlign;
  }

  changeElementBorder() {
    this.selectedElement()!.style.border = this.elementStyle().border;
  }
}
