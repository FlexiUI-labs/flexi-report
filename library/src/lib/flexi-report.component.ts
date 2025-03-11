import { DragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, inject, input, Renderer2, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import { StyleService } from './services/style.service';
import { PageService } from './services/page.service';
import { TableSettingModel } from './models/table-setting.model';
import { FlexiButtonComponent } from 'flexi-button';

@Component({
  selector: 'flexi-report',
  imports: [
    FormsModule,
    CommonModule,
    DragDropModule,
    FlexiButtonComponent
  ],
  templateUrl: "flexi-report.component.html",
  styleUrl: `flexi-report.component.css`
})
export class FlexiReportComponent {
  readonly data = input<any[]>();
  readonly language = input<"en" | "tr">("en");

  readonly elements = signal<string[]>([
    "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "TABLE"
  ]);
  readonly tableHeads = signal<TableSettingModel[]>([]);
  readonly elementBind = signal<string>("");
  readonly properties = computed(() => this.getObjectProperties(this.data() ?? []));

  readonly pageSettingsText = computed(() => this.language() === "en" ? "Page Settings" : "Sayfa Ayarları");
  readonly pageSizeText = computed(() => this.language() === "en" ? "Page Size" : "Sayfa Boyutu");
  readonly pageOrientationText = computed(() => this.language() === "en" ? "Page Orientation" : "Sayfa Yönlendirme");
  readonly landscapeText = computed(() => this.language() === "en" ? "Landscape" : "Yatay");
  readonly portraitText = computed(() => this.language() === "en" ? "Portrait" : "Dikey");
  readonly elementsText = computed(() => this.language() === "en" ? "Elements" : "Elementler");
  readonly previewText = computed(() => this.language() === "en" ? "Preview" : "Önizleme");
  readonly clearText = computed(() => this.language() === "en" ? "Clear" : "Temizle");
  readonly DonwloadAsPDFText = computed(() => this.language() === "en" ? "Download as PDF" : "PDF olarak İndir");
  readonly styleSettingsText = computed(() => this.language() === "en" ? "Style Settings" : "Style Ayarları");
  readonly tableSettingsText = computed(() => this.language() === "en" ? "Table Settings" : "Table Ayarları");
  readonly noSelectText = computed(() => this.language() === "en" ? "No select" : "Seçim yapılmadı");
  readonly addNewHeaderText = computed(() => this.language() === "en" ? "Add new header" : "Yeni başlık ekle");
  readonly deleteElementText = computed(() => this.language() === "en" ? "Delete element" : "Elementi sil");

  readonly elementArea = viewChild.required<ElementRef>("elementArea");
  readonly pdfArea = viewChild.required<ElementRef>('pdfArea');
  readonly stylePart = viewChild.required<ElementRef>("stylePart");

  readonly #renderer = inject(Renderer2);
  readonly #dragDrop = inject(DragDrop);
  readonly style = inject(StyleService);
  readonly page = inject(PageService);

  addElement(type: string) {
    if (!this.elementArea()) return;

    type = type.toLowerCase();
    let newElement: HTMLElement | null = null;

    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(type)) {
      newElement = this.createHeading(type);
    } else if (type === "span") {
      newElement = this.createSpan();
    } else if (type === "table") {
      newElement = this.createTable();
    }

    if (!newElement) return;

    this.#renderer.setStyle(newElement, 'cursor', 'move');
    this.#renderer.setStyle(newElement, 'padding', '10px');
    this.#renderer.appendChild(this.elementArea().nativeElement, newElement);

    this.#renderer.listen(newElement, 'click', () => {
      this.clearAllSelectedClass();
      newElement.classList.add("flexi-report-selected");
      this.style.selectedElement.set(newElement);
      this.stylePart().nativeElement.style.display = "block";
      this.style.elementStyle.set({
        text: newElement.innerText,
        width: newElement.style.width,
        textAlign: newElement.style.textAlign,
        border: newElement.style.border
      });
      if (type === "table") {
        this.getTableHeads(newElement);
      }
    });

    this.#dragDrop.createDrag(newElement);
  }

  createHeading(type: string): HTMLElement {
    const heading = this.#renderer.createElement(type);
    const text = this.#renderer.createText("Title");
    this.#renderer.appendChild(heading, text);
    this.#renderer.setStyle(heading, 'width', 'min-content');
    this.#renderer.setStyle(heading, 'border', '1px solid black');
    return heading;
  }

  createSpan(): HTMLElement {
    const span = this.#renderer.createElement("span");
    const text = this.#renderer.createText("span");
    this.#renderer.appendChild(span, text);
    this.#renderer.setStyle(span, 'border', '1px solid black');
    this.#renderer.setStyle(span, 'display', 'inline-block');
    return span;
  }

  createTable(): HTMLElement {
    const table = this.#renderer.createElement("table");
    this.#renderer.setStyle(table, 'border', '1px solid black');
    this.#renderer.setStyle(table, 'border-collapse', 'collapse');
    this.#renderer.setStyle(table, 'width', '100%');

    const thead = this.#renderer.createElement("thead");
    const tbody = this.#renderer.createElement("tbody");
    this.#renderer.appendChild(table, thead);
    this.#renderer.appendChild(table, tbody);

    const headerRow = this.#renderer.createElement("tr");
    for (let i = 0; i < 3; i++) {
      const th = this.#renderer.createElement("th");
      this.#renderer.appendChild(th, this.#renderer.createText(`Header ${i + 1}`));
      this.#renderer.setStyle(th, 'border', '1px solid black');
      this.#renderer.setStyle(th, 'padding', '5px');
      this.#renderer.appendChild(headerRow, th);
    }
    this.#renderer.appendChild(thead, headerRow);

    return table;
  }

  clearAllSelectedClass(){
    const elements = this.pdfArea().nativeElement.querySelectorAll(".flexi-report-selected");
    if(elements.length === 0) return;
    elements.forEach((el:any) => {
      el.classList.remove("flexi-report-selected")
    });
  }

  downloadAsPDF() {
    if (!this.pdfArea()) return;

    const pageWidth = +this.page.pageSetting().width.replace("px", "");
    const pageHeight = +this.page.pageSetting().height.replace("px", "");

    const pdf = new jsPDF({
      orientation: this.page.orientation(),
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

  preview() {
    this.prepareTableBind();
  }

  prepareTableBind() {
    const tables = this.pdfArea().nativeElement.querySelectorAll("table[data-bind]");

    tables.forEach((table: HTMLTableElement) => {
      const bindProperty = table.getAttribute("data-bind");
      if (!bindProperty || !this.data()) return;

      let tbody: any = table.querySelector("tbody");

      if (!tbody) {
        tbody = this.#renderer.createElement("tbody");
        this.#renderer.appendChild(table, tbody);
      }

      tbody.querySelectorAll(".remove-after").forEach((el: any) => el.remove());

      const headers = Array.from(table.querySelectorAll("th")).map(th => ({
        property: th.getAttribute("data-bind") || "",
        width: th.style.width || "auto"
      }));

      this.data()!.forEach(res => {
        const row = this.#renderer.createElement("tr");
        row.classList.add("remove-after");

        headers.forEach(header => {
          const cell = this.#renderer.createElement("td");
          const value = header.property ? res[header.property] || "" : "";
          this.#renderer.appendChild(cell, this.#renderer.createText(value));
          this.#renderer.setStyle(cell, "border", "1px solid black");
          this.#renderer.setStyle(cell, "padding", "5px");
          this.#renderer.appendChild(row, cell);
        });

        this.#renderer.appendChild(tbody, row);
      });
    });
  }

  clear() {
    const elements = this.pdfArea().nativeElement.querySelectorAll(".remove-after");
    elements.forEach((el: HTMLElement) => el.remove());
  }

  closeStylePart() {
    const el: any = document.querySelector(".flexi-report-style-part");
    el.style.display = "none";
  }

  getObjectProperties(data: any[]): string[] {
    return data.length > 0 ? Object.keys(data[0]) : [];
  }

  getTableHeads(element: HTMLElement) {
    const headers: TableSettingModel[] = [];
    const firstRow = element.querySelector("thead tr");

    if (!firstRow) {
      this.tableHeads.set(headers);
      return;
    }

    firstRow.querySelectorAll("th").forEach(th => {
      headers.push({
        value: th.innerText.trim(),
        width: th.style.width || "auto",
        property: th.getAttribute("data-bind") || ""
      });
    });

    this.tableHeads.set(headers);
  }

  updateTableHeads() {
    if (!this.style.selectedElement() || this.style.selectedElement()?.tagName !== "TABLE") return;

    const table = this.style.selectedElement() as HTMLTableElement;
    let headerRow: any = table.querySelector("tr");

    if (!headerRow) {
      headerRow = this.#renderer.createElement("tr");
      this.#renderer.appendChild(table, headerRow);
    }

    while (headerRow.firstChild) {
      this.#renderer.removeChild(headerRow, headerRow.firstChild);
    }

    this.tableHeads().forEach(head => {
      const th = this.#renderer.createElement("th");
      this.#renderer.appendChild(th, this.#renderer.createText(head.value));
      this.#renderer.setStyle(th, 'border', '1px solid black');
      this.#renderer.setStyle(th, 'padding', '5px');
      this.#renderer.setStyle(th, 'width', head.width);
      if (head.property) {
        this.#renderer.setAttribute(th, "data-bind", head.property);
      }
      this.#renderer.appendChild(headerRow, th);
    });

    this.#renderer.setAttribute(table, "data-bind", "true");
  }

  addNewTableHead() {
    this.tableHeads.update(prev => [...prev, { value: "New Header", width: "auto", property: "" }]);
    this.updateTableHeads();
  }

  selectBindProperty() {
    this.#renderer.setAttribute(this.style.selectedElement(), "data-bind", this.elementBind());
  }

  deleteElement(){
    if(this.style.selectedElement()){
      this.style.selectedElement()!.remove();
      this.closeStylePart();
    }
  }
}