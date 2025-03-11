import { DragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, Renderer2, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';

export interface ElementStyle{
  text: string;
  width: string;
  textAlign: string;
  border: string;
}

export const initializeElementStyle:ElementStyle = {
  text: "",
  width: "100%",
  textAlign: "start",
  border: "1px solid black"
}

export interface PageSetting{
  width: string;
  height: string;
}

export const initializePageSetting:PageSetting = {
  width: "794px",
  height: "1123px"
}

@Component({
  selector: 'flexi-report',
  imports: [FormsModule, CommonModule, DragDropModule],
  templateUrl: "flexi-report.component.html",
  styleUrl: `flexi-report.component.css`
})
export class FlexiReportComponent {
  readonly pageSize = signal<"a4" | "a5" | "a6">("a4");
  readonly orientation = signal<"landscape" | "portrait">("portrait");
  readonly selectedElement = signal<HTMLElement | null>(null);
  readonly elementStyle = signal<ElementStyle>(initializeElementStyle);
  readonly pageSetting = computed(() => {
    if(this.orientation() === "portrait"){
      if(this.pageSize() === "a4"){
        return {
          width: "794px",
          height: "1123px",
        }
      }else if(this.pageSize() === "a5"){
        return {
          width: "559px",
          height: "794px"
        }
      }
      else if(this.pageSize() === "a6"){
        return {
          width: "397px",
          height: "559px"
        }
      }
    }else if(this.orientation() === "landscape"){
      if(this.pageSize() === "a4"){
        return {
          width: "1123px",
          height: "794px"
        }
      }else if(this.pageSize() === "a5"){
        return {
          width: "794px",
          height: "559px"
        }
      }
      else if(this.pageSize() === "a6"){
        return {
          width: "559px",
          height: "397px"
        }
      }
    }
    return initializePageSetting;
  })

  readonly elementArea = viewChild.required<ElementRef>("elementArea");
  readonly pdfArea = viewChild.required<ElementRef>('pdfArea');

  readonly #renderer = inject(Renderer2);
  readonly #dragDrop = inject(DragDrop);

  addElement(type:elementType){
    if(!this.elementArea()) return;

    if(type === "h1"){
      const newElement = this.#renderer.createElement("h1");
      const text = this.#renderer.createText("Title");

      this.#renderer.appendChild(newElement, text);

      this.#renderer.setStyle(newElement, 'border', '1px solid black');
      this.#renderer.setStyle(newElement, 'padding', '10px');
      this.#renderer.setStyle(newElement, 'cursor', 'move');
      this.#renderer.setStyle(newElement, 'width', 'min-content');

      this.#renderer.appendChild(this.elementArea().nativeElement, newElement);

      this.#renderer.listen(newElement, 'click', () => {
        this.selectedElement.set(newElement);
        this.elementStyle.set({
          text: newElement.innerText,
          width: newElement.style.width,
          textAlign: newElement.style.textAlign,
          border: newElement.style.border
        });
      });

      this.#dragDrop.createDrag(newElement);
    }
  }

  changeElementText() {
    this.selectedElement()!.innerText = this.elementStyle().text;
  }

  changeElementWith(){
    this.selectedElement()!.style.width = this.elementStyle().width;
  }

  changeElementTextAlign(){
    this.selectedElement()!.style.textAlign = this.elementStyle().textAlign;
  }

  changeElementBorder(){
    this.selectedElement()!.style.border = this.elementStyle().border;
  }

  downloadAsPDF() {
    if (!this.pdfArea()) return;

    const pageWidth = +this.pageSetting().width.replace("px","");
    const pageHeight = +this.pageSetting().height.replace("px","");

    const pdf = new jsPDF({
      orientation: this.orientation(),
      unit: 'px',
      format: [pageWidth, pageHeight]
    });

    pdf.html(this.pdfArea().nativeElement, {
      callback: (doc) => {
        doc.save('report.pdf');
      },
      x: 0,
      y: 0,
      width: pageWidth,
      windowWidth: pageWidth
    });
  }
}

export type elementType = "h1";