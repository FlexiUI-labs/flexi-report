import { DragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, ElementRef, EventEmitter, inject, input, linkedSignal, OnChanges, output, Output, Renderer2, signal, SimpleChanges, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import { StyleService } from './services/style.service';
import { PageService } from './services/page.service';
import { TableSettingModel } from './models/table-setting.model';
import { FlexiButtonComponent } from 'flexi-button';
import { ReportModel } from './models/report.model';
import { RouterLink } from '@angular/router';
import { FlexiTooltipDirective } from 'flexi-tooltip';

@Component({
  selector: 'flexi-report',
  imports: [
    FormsModule,
    CommonModule,
    DragDropModule,
    FlexiButtonComponent,
    FlexiTooltipDirective,
    RouterLink
  ],
  templateUrl: "flexi-report.component.html",
  styleUrl: `flexi-report.component.css`
})
export class FlexiReportComponent implements OnChanges {
  readonly data = input<any[]>();
  readonly language = input<"en" | "tr">("en");
  readonly report = input<ReportModel>();
  readonly editPath = input<string>();
  readonly isPreview = input<boolean>(false);

  readonly elements = signal<string[]>([
    "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "P", "HR", "TABLE"
  ]);
  readonly tableHeads = signal<TableSettingModel[]>([]);
  readonly elementBind = signal<string>("");
  readonly endpoint = signal<string>("https://jsonplaceholder.typicode.com/todos");
  readonly reportTitle = linkedSignal(() => this.report()?.name ? this.report()!.name : "New Report");
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
  readonly deleteText = computed(() => this.language() === "en" ? "Delete" : "Sil");
  readonly propertiesText = computed(() => this.language() === "en" ? "Properties" : "Properties");
  readonly endpointText = computed(() => this.language() === "en" ? "Endpoint" : "Endpoint");
  readonly reportTitleText = computed(() => this.language() === "en" ? "Report Title" : "Rapor Başlığı");
  readonly saveText = computed(() => this.language() === "en" ? "Save" : "Kaydet");
  readonly editText = computed(() => this.language() === "en" ? "Edit" : "Güncelle");
  readonly newReportText = computed(() => this.language() === "en" ? "New Report" : "Yeni Rapor");

  readonly elementArea = viewChild.required<ElementRef>("elementArea");
  readonly pdfArea = viewChild.required<ElementRef>('pdfArea');
  readonly stylePart = viewChild.required<ElementRef>("stylePart");

  readonly onSave = output<any>();
  readonly onNewReport = output<void>();
  readonly onDelete = output<any>();

  readonly #renderer = inject(Renderer2);
  readonly #dragDrop = inject(DragDrop);
  readonly style = inject(StyleService);
  readonly page = inject(PageService);

  ngOnChanges(changes: SimpleChanges): void {
    if(this.report()){
      this.loadReport();

      if(!this.isPreview()) this.restoreDragFeature();
      else this.preview();
    }
  }

  private attachClickListener(newElement: HTMLElement, type: string) {
    this.#renderer.listen(newElement, 'click', () => {
      this.clearAllSelectedClass();
      this.#renderer.addClass(newElement, 'flexi-report-selected');
      //this.makeResizable(newElement);
      this.style.selectedElement.set(newElement);
      this.stylePart().nativeElement.style.display = "block";
      this.style.elementStyle.set({
        text: newElement.innerText,
        width: newElement.style.width,
        textAlign: newElement.style.textAlign ? newElement.style.textAlign : "start",
        borderWidth: newElement.style.borderWidth ? newElement.style.borderWidth : undefined,
        borderStyle: newElement.style.borderStyle ? newElement.style.borderStyle : undefined,
        borderColor: newElement.style.borderColor ? newElement.style.borderColor : undefined,
        fontSize: newElement.style.fontSize ? newElement.style.fontSize : "16px",
        fontFamily: newElement.style.fontFamily ? newElement.style.fontFamily : "Arial",
        color: newElement.style.color ? newElement.style.color : "#000000",
        backgroundColor: newElement.style.backgroundColor ? newElement.style.backgroundColor : "#ffffff",
        padding: newElement.style.padding ? newElement.style.padding : "10px",
        margin: newElement.style.margin ? newElement.style.margin : "0px",
        borderRadius: newElement.style.borderRadius ? newElement.style.borderRadius : "0px"
      });
      if (type === "table") {
        this.getTableHeads(newElement);
      }
    });
  }

  addElement(type: string) {
    if (!this.elementArea()) return;

    type = type.toLowerCase();
    let newElement: HTMLElement | null = null;

    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(type)) {
      newElement = this.createHeading(type);
    } else if (type === "span") {
      newElement = this.createSpan();
    } else if (type === "p") {
      newElement = this.createParagraph();
    } else if (type === "hr") {
      newElement = this.createHr();
    } else if (type === "table") {
      newElement = this.createTable();
    }

    if (!newElement) return;

    newElement.classList.add("draggable");
    newElement.setAttribute('data-type', type);
    this.attachClickListener(newElement, type);

    this.#renderer.setStyle(newElement, 'cursor', 'move');
    this.#renderer.appendChild(this.elementArea().nativeElement, newElement);

    this.#dragDrop.createDrag(newElement);
  }

  createHeading(type: string): HTMLElement {
    const heading = this.#renderer.createElement(type);
    const text = this.#renderer.createText("Title");
    this.#renderer.appendChild(heading, text);
    this.#renderer.setStyle(heading, 'width', 'fit-content');
    return heading;
  }

  createSpan(): HTMLElement {
    const span = this.#renderer.createElement("span");
    const text = this.#renderer.createText("span");
    this.#renderer.appendChild(span, text);
    this.#renderer.setStyle(span, 'display', 'inline-block');
    return span;
  }

  createParagraph(): HTMLElement {
    const span = this.#renderer.createElement("p");
    const text = this.#renderer.createText("paragraph");
    this.#renderer.appendChild(span, text);
    this.#renderer.setStyle(span, 'display', 'inline-block');
    return span;
  }

  createHr(): HTMLElement {
    const hr = this.#renderer.createElement("hr");
    return hr;
  }

  createTable(): HTMLElement {
    const table = this.#renderer.createElement("table");
    this.#renderer.setStyle(table, 'border-collapse', 'collapse');
    this.#renderer.setStyle(table, 'width', '90%');

    const thead = this.#renderer.createElement("thead");
    const tbody = this.#renderer.createElement("tbody");
    this.#renderer.appendChild(table, thead);
    this.#renderer.appendChild(table, tbody);

    const headerRow = this.#renderer.createElement("tr");
    for (let i = 0; i < 3; i++) {
      const th = this.#renderer.createElement("th");
      this.#renderer.appendChild(th, this.#renderer.createText(`Header ${i + 1}`));
      this.#renderer.setStyle(th, 'border-width', '1px');
      this.#renderer.setStyle(th, 'border-style', 'solid');
      this.#renderer.setStyle(th, 'border-color', 'black');
      this.#renderer.setStyle(th, 'padding', '5px');
      this.#renderer.appendChild(headerRow, th);
    }
    this.#renderer.appendChild(thead, headerRow);

    return table;
  }

  clearAllSelectedClass() {
    const elements = this.pdfArea().nativeElement.querySelectorAll(".flexi-report-selected");
    if (elements.length === 0) return;
    elements.forEach((el: any) => {
      el.classList.remove("flexi-report-selected");
      // const handle = el.querySelector('.flexi-report-resize-handle');
      // if (handle) {
      //   this.#renderer.removeChild(el, handle);
      // }
    });
  }

  downloadAsPDF() {
    if (!this.pdfArea()) return;

    this.preview();

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

    // setTimeout(() => {
    //   this.clear();
    // }, 500);
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

      this.data()!.forEach((res, i) => {
        const row = this.#renderer.createElement("tr");
        row.classList.add("remove-after");

        headers.forEach(header => {
          const cell = this.#renderer.createElement("td");
          const value = header.property ? (header.property === "index" ? i + 1 : res[header.property] || "") : "";
          this.#renderer.appendChild(cell, this.#renderer.createText(value));
          //this.#renderer.setStyle(cell, "padding", "5px");
          this.#renderer.appendChild(row, cell);
        });

        debugger
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
    this.clearAllSelectedClass();
  }

  getObjectProperties(data: any[]): string[] {
    const properties = data.length > 0 ? Object.keys(data[0]) : [];
    properties.unshift("index");
    return properties;
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

  deleteTableHead(index: number) {
    this.tableHeads().splice(index, 1);
    this.updateTableHeads();
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
      this.#renderer.setStyle(th, 'padding', '5px');
      this.#renderer.setStyle(th, 'border-width', '1px');
      this.#renderer.setStyle(th, 'border-style', 'solid');
      this.#renderer.setStyle(th, 'border-color', 'black');
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

  deleteElement() {
    if (this.style.selectedElement()) {
      this.style.selectedElement()!.remove();
      this.closeStylePart();
    }
  }

  saveReport() {
    if (!this.pdfArea()) return;
    const reportContent = this.elementArea().nativeElement.innerHTML;
    const report = {
      name: this.reportTitle(),
      endpoint: this.endpoint(),
      content: reportContent,
      createdAt: new Date()
    };

    this.clearAllSelectedClass();
    this.closeStylePart();
    this.clear();
    setTimeout(() => {
      this.onSave.emit(report);
    }, 300);
  }

  loadReport() {
    if (!this.pdfArea() || !this.report()) return;
    this.elementArea().nativeElement.innerHTML = this.report()!.content;
    this.clearAllSelectedClass();
  }

  restoreDragFeature() {
    if (!this.elementArea()) return;
    const draggableElements = this.elementArea().nativeElement.querySelectorAll(".draggable");
    draggableElements.forEach((el: HTMLElement) => {
      this.#dragDrop.createDrag(el);
      const type = el.getAttribute('data-type') || el.tagName.toLowerCase();
      this.attachClickListener(el, type);
    });
  }

  makeResizable(newElement: HTMLElement) {
    const resizeHandle = this.#renderer.createElement('div');
    this.#renderer.addClass(resizeHandle, 'flexi-report-resize-handle');
    this.#renderer.appendChild(newElement, resizeHandle);

    let startX: number, startY: number, startWidth: number, startHeight: number;

    const mouseMoveHandler = (event: MouseEvent) => {
      const newWidth = startWidth + (event.clientX - startX);
      const newHeight = startHeight + (event.clientY - startY);
      this.#renderer.setStyle(newElement, 'width', `${newWidth}px`);
      this.#renderer.setStyle(newElement, 'height', `${newHeight}px`);
    };

    const mouseUpHandler = () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    resizeHandle.addEventListener('mousedown', (event: MouseEvent) => {
      event.stopPropagation();
      startX = event.clientX;
      startY = event.clientY;
      startWidth = newElement.offsetWidth;
      startHeight = newElement.offsetHeight;
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    });
  }
}
