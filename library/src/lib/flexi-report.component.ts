import { DragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, linkedSignal, OnChanges, output, Renderer2, signal, SimpleChanges, viewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import { StyleService } from './services/style.service';
import { TableSettingModel } from './models/table-setting.model';
import { FlexiButtonComponent } from 'flexi-button';
import { ReportModel } from './models/report.model';
import { RouterLink } from '@angular/router';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { FlexiGridModule } from 'flexi-grid';
import { FlexiReportLoadingComponent } from './flexi-report-loading/flexi-report-loading.component';

@Component({
  selector: 'flexi-report',
  imports: [
    FormsModule,
    CommonModule,
    DragDropModule,
    FlexiButtonComponent,
    FlexiTooltipDirective,
    RouterLink,
    NgxJsonViewerModule,
    FlexiGridModule,
    FlexiReportLoadingComponent
  ],
  templateUrl: "flexi-report.component.html",
  styleUrl: `flexi-report.component.css`,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexiReportComponent implements OnChanges {
  readonly data = input<any[]>();
  readonly language = input<"en" | "tr">("en");
  readonly report = input<ReportModel>();
  readonly editPath = input<string>();
  readonly isPreview = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly sqlQueryLoadingSignal = input<boolean>(false);
  readonly tablesData = input<any[]>();

  readonly sqlQuery = signal<string>("");
  readonly loadingSignal = linkedSignal(() => this.loading());
  readonly dataString = computed(() => JSON.stringify(this.data()) ?? "");
  readonly zoomValue = linkedSignal<number>(() => this.isPreview() ? 1 : 0.8);
  readonly pageSetting = signal<{ width: string, height: string }>({ width: "794px", height: "1123px" });
  readonly reportSignal = linkedSignal(() => this.report() ?? new ReportModel());
  readonly elements = signal<string[]>([
    "H1", "H2", "H3", "H4", "H5", "H6", "SPAN", "P", "HR", "IMG", "TABLE"
  ]);
  readonly tableHeads = signal<TableSettingModel[]>([]);
  readonly elementBind = signal<string>("");
  readonly properties = computed(() => this.getObjectProperties(this.data() ?? []));
  readonly showProperties = signal<boolean>(false);
  readonly showPageSettings = signal<boolean>(false);
  readonly showElements = signal<boolean>(true);

  readonly pageSettingsText = computed(() => this.language() === "en" ? "Page Settings" : "Sayfa Ayarları");
  readonly pageSizeText = computed(() => this.language() === "en" ? "Page Size" : "Sayfa Boyutu");
  readonly pageOrientationText = computed(() => this.language() === "en" ? "Page Orientation" : "Sayfa Yönlendirme");
  readonly landscapeText = computed(() => this.language() === "en" ? "Landscape" : "Yatay");
  readonly portraitText = computed(() => this.language() === "en" ? "Portrait" : "Dikey");
  readonly elementsText = computed(() => this.language() === "en" ? "Elements" : "Elementler");
  readonly previewText = computed(() => this.language() === "en" ? "Preview" : "Önizleme");
  readonly clearText = computed(() => this.language() === "en" ? "Clear" : "Temizle");
  readonly donwloadAsPDFText = computed(() => this.language() === "en" ? "Download as PDF" : "PDF olarak İndir");
  readonly styleSettingsText = computed(() => this.language() === "en" ? "Style Settings" : "Style Ayarları");
  readonly tableHeadersSettingsText = computed(() => this.language() === "en" ? "Table Headers Settings" : "Table Başlık Ayarları");
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
  readonly pageFontFamilyText = computed(() => this.language() === "en" ? "Font Family" : "Font Family");
  readonly showFooterText = computed(() => this.language() === "en" ? "Show Footer" : "Footer Göster");
  readonly selectImageText = computed(() => this.language() === "en" ? "Select Image" : "Resim Seç");
  readonly showDataResultText = computed(() => this.language() === "en" ? "Show Data Result" : "Data Resultu Göster");
  readonly printText = computed(() => this.language() === "en" ? "Print" : "Yazdır");
  readonly openSqlQueryPartText = computed(() => this.language() === "en" ? "Open Sql Query Part" : "Sql Query Parçasını Aç");

  readonly elementArea = viewChild.required<ElementRef>("elementArea");
  readonly pdfArea = viewChild.required<ElementRef>('pdfArea');
  readonly stylePart = viewChild.required<ElementRef>("stylePart");
  readonly dataResultPart = viewChild.required<ElementRef>("dataResultPart");
  readonly sqlQueryPart = viewChild.required<ElementRef>("sqlQueryPart");

  readonly onSave = output<any>();
  readonly onNewReport = output<void>();
  readonly onDelete = output<any>();
  readonly onEndpointChange = output<string>();
  readonly onExecute = output<string>();

  readonly #renderer = inject(Renderer2);
  readonly #dragDrop = inject(DragDrop);
  readonly style = inject(StyleService);

  ngOnChanges(changes: SimpleChanges): void {
    if (this.reportSignal()) {
      this.loadReport();
      this.changePageSetting();

      if (!this.isPreview()) this.restoreDragFeature();
      else this.preview();
    }
  }

  attachClickListener(newElement: HTMLElement, type: string) {
    this.#renderer.listen(newElement, 'click', () => {
      this.clearAllSelectedClass();
      this.#renderer.addClass(newElement, 'flexi-report-selected');
      this.style.selectedElement.set(newElement);
      this.stylePart().nativeElement.style.display = "flex";
      this.style.elementStyle.set({
        text: newElement.innerText,
        width: newElement.style.width,
        height: newElement.style.height,
        objectFit: newElement.style.objectFit || "cover",
        textAlign: newElement.style.textAlign || "start",
        borderWidth: newElement.style.borderWidth || "0px",
        borderStyle: newElement.style.borderStyle || "unset",
        borderColor: this.rgbStringToHex(newElement.style.borderColor),
        fontSize: newElement.style.fontSize || "11px",
        fontFamily: newElement.style.fontFamily || "IBM Plex Sans",
        color: this.rgbStringToHex(newElement.style.color),
        backgroundColor: newElement.style.backgroundColor === "" ? "#ffffff" : this.rgbStringToHex(newElement.style.backgroundColor),
        padding: newElement.style.padding || "0px",
        margin: newElement.style.margin || "0px",
        borderRadius: newElement.style.borderRadius || "0px",
        fontWeight: newElement.style.fontWeight || "normal",
        textDecoration: newElement.style.textDecoration || "none"
      });
      if (type === "table") {
        const th = newElement.querySelector("th");
        this.style.elementStyle.update(prev => ({
          ...prev,
          thBorderWidth: th?.style.borderWidth,
          thBorderStyle: th?.style.borderStyle,
          thBorderColor: this.rgbStringToHex(th?.style.borderColor || "#000000"),
          thFontSize: th?.style.fontSize || "11px",
        }));

        const td = newElement.querySelector("td");
        this.style.elementStyle.update(prev => ({
          ...prev,
          tdBorderWidth: this.style.elementStyle().tdBorderWidth || (td?.style.borderWidth || th?.style.borderWidth),
          tdBorderStyle: this.style.elementStyle().tdBorderStyle || (td?.style.borderStyle || th?.style.borderStyle),
          tdBorderColor: this.style.elementStyle().tdBorderColor || (td ? this.rgbStringToHex(td.style.borderColor) : this.rgbStringToHex(th?.style.borderColor || "#000000")),
          tdFontSize: this.style.elementStyle().tdFontSize || (td?.style.fontSize || "10px"),
        }));

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
    } else if (type === "img") {
      newElement = this.createImage();
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

  createImage(): HTMLElement {
    const img = this.#renderer.createElement("img");
    this.#renderer.setStyle(img, "width", "100px");
    this.#renderer.setStyle(img, "height", "100px");
    this.#renderer.setStyle(img, "object-fit", "cover");
    return img;
  }

  createTable(): HTMLElement {
    const table = this.#renderer.createElement("table");
    this.#renderer.setStyle(table, 'border-collapse', 'collapse');
    this.#renderer.setStyle(table, 'width', '97%');

    const thead = this.#renderer.createElement("thead");
    this.#renderer.appendChild(table, thead);

    const headerRow = this.#renderer.createElement("tr");
    for (let i = 0; i < 3; i++) {
      const th = this.#renderer.createElement("th");
      this.#renderer.appendChild(th, this.#renderer.createText(`Header ${i + 1}`));
      this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().thBorderWidth || '1px');
      this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'dotted');
      this.#renderer.setStyle(th, 'border-color', this.style.elementStyle().thBorderColor || 'black');
      this.#renderer.setStyle(th, 'font-size', this.style.elementStyle().thFontSize || '11px');
      this.#renderer.setStyle(th, 'padding', '5px');
      this.#renderer.appendChild(headerRow, th);
    }
    this.#renderer.appendChild(thead, headerRow);

    const tbody = this.#renderer.createElement("tbody");
    this.#renderer.appendChild(table, tbody);

    for (let j = 0; j < 3; j++) {
      const bodyRow = this.#renderer.createElement("tr");
      for (let i = 0; i < 3; i++) {
        const td = this.#renderer.createElement("td");
        this.#renderer.appendChild(td, this.#renderer.createText(`Example ${i + 1}`));
        this.#renderer.setStyle(td, 'border-width', '1px');
        this.#renderer.setStyle(td, 'border-style', 'dotted');
        this.#renderer.setStyle(td, 'border-color', 'black');
        this.#renderer.setStyle(td, 'font-size', '10px');
        this.#renderer.setStyle(td, 'padding', '5px');
        this.#renderer.addClass(td, "remove-after");
        this.#renderer.appendChild(bodyRow, td);
      }
      this.#renderer.appendChild(tbody, bodyRow);
    }

    return table;
  }

  clearAllSelectedClass() {
    this.style.selectedElement.set(null);
    const elements = this.pdfArea().nativeElement.querySelectorAll(".flexi-report-selected");
    if (elements.length === 0) return;
    elements.forEach((el: any) => {
      el.classList.remove("flexi-report-selected");
    });
  }

  async downloadAsPDF() {
    if (!this.pdfArea()) return;

    this.preview();
    this.loadingSignal.set(true);

    await new Promise(resolve => setTimeout(resolve, 100));
    const pageWidth = +this.pageSetting().width.replace("px", "");
    const pageHeight = +this.pageSetting().height.replace("px", "");

    const pdf = new jsPDF({
      orientation: this.reportSignal().pageOrientation,
      unit: 'px',
      format: [pageWidth, pageHeight]
    });

    let ttfLink = "https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf";
    let fontName = "Roboto";

    pdf.addFont(ttfLink, fontName, "normal");
    pdf.setFont(fontName);

    pdf.html(this.pdfArea().nativeElement, {
      callback: (doc) => {
        doc.save('report.pdf');
      },
      x: 0,
      y: 0,
      width: pageWidth,
      windowWidth: pageWidth
    });

    this.loadingSignal.set(false);
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
      const td = tbody.querySelector("td");
      const tdBorderWidth = td.style.borderWidth;
      const tdBorderStyle = td.style.borderStyle;
      const tdBorderColor = td.style.borderColor;
      const tdFontSize = td.style.fontSize;

      if (!tbody) {
        tbody = this.#renderer.createElement("tbody");
        this.#renderer.appendChild(table, tbody);
      }

      tbody.querySelectorAll(".remove-after").forEach((el: any) => el.remove());

      let tfoot = table.querySelector("tfoot") as HTMLElement;
      const tfootTH = tfoot?.querySelector("tfoot th") as HTMLElement;
      if (tfoot) {
        tfoot.remove();
      }

      const headers = Array.from(table.querySelectorAll("th")).map(th => ({
        property: th.getAttribute("data-bind") || "",
        format: th.getAttribute("data-format") || "",
        width: th.style.width || "auto",
        textAlign: th.style.textAlign || "start",
        footerValue: th.getAttribute("data-footer") || "",
        borderWidth: th.style.borderWidth,
        borderStyle: th.style.borderStyle,
        borderColor: th.style.borderColor,
        fontSize: th.style.fontSize,
      }));

      this.data()!.forEach((res, i) => {
        const row = this.#renderer.createElement("tr");
        row.classList.add("remove-after");

        headers.forEach(header => {
          const cell = this.#renderer.createElement("td");
          cell.style.borderWidth = tdBorderWidth;
          cell.style.borderStyle = tdBorderStyle;
          cell.style.borderColor = tdBorderColor;
          cell.style.fontSize = tdFontSize;
          cell.style.textAlign = header.textAlign;
          let value = header.property ? (header.property === "index" ? i + 1 : this.getNestedValue(res, header.property) || "") : "";
          if (header.format) {
            value = this.formatValue(value, header.format);
          }
          this.#renderer.appendChild(cell, this.#renderer.createText(value));
          this.#renderer.appendChild(row, cell);
        });
        this.#renderer.appendChild(tbody, row);
      });

      if (table.getAttribute("data-show-footer") === "true" && this.data()) {
        const tfoot = this.#renderer.createElement("tfoot");
        const footerRow = this.#renderer.createElement("tr");
        this.#renderer.appendChild(tfoot, footerRow);;

        headers.forEach((header, index) => {
          const footerCell = this.#renderer.createElement("th");
          let value = header.footerValue;
          if (value === "sum") {
            let total = 0;
            this.data()!.forEach(res => {
              total += +res[header.property];
            })
            value = this.formatValue(total.toString(), header.format);
          } else if (value === "average") {
            let total = 0;
            this.data()!.forEach(res => {
              total += +res[header.property];
            })
            total = total / this.data()!.length
            value = this.formatValue(total.toString(), header.format);
          }
          const theadTH = headers[index];
          this.#renderer.appendChild(footerCell, this.#renderer.createText(value));
          this.#renderer.setStyle(footerCell, 'border-width', theadTH.borderWidth || '1px');
          this.#renderer.setStyle(footerCell, 'border-style', theadTH.borderStyle || 'dotted');
          this.#renderer.setStyle(footerCell, 'border-color', theadTH.borderColor || 'black');
          this.#renderer.setStyle(footerCell, 'text-align', theadTH.textAlign || 'start');
          this.#renderer.setStyle(footerCell, 'font-weight', 'bold');
          this.#renderer.setStyle(footerCell, 'font-size', theadTH.fontSize || '11px');
          this.#renderer.appendChild(footerRow, footerCell);
        });

        this.#renderer.appendChild(table, tfoot);
      }
    });
  }

  getNestedValue(obj: any, path: string, defaultValue: any = ""): any {
    return path.split('.').reduce((acc, key) => acc && acc[key] !== undefined ? acc[key] : defaultValue, obj);
  }

  formatValue(value: string | number, format: string): string {
    if (format.toLowerCase().startsWith('c') || format.toLowerCase().startsWith('n')) {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) return String(value);
      const decimals = parseInt(format.substring(1), 10) || 2;
      const region = this.language() === "tr" ? "tr-TR" : "en-US";
      return num.toLocaleString(region, {
        style: 'decimal',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }

    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      if (format === 'dd MMM yyyy') {
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
      }
      return date.toLocaleDateString();
    }

    return String(value);
  }

  clear() {
    const tables = this.pdfArea().nativeElement.querySelectorAll("table");
    tables.forEach((table: HTMLElement) => {
      const theads = table.querySelectorAll("thead th") as NodeListOf<HTMLElement>;
      let tbody = table.querySelector("tbody");
      const tbodyTD = table.querySelector("tbody td") as HTMLElement;

      if (!tbody) {
        tbody = this.#renderer.createElement("tbody");
        this.#renderer.appendChild(table, tbody);
      } else {
        const trs = table.querySelectorAll("tbody tr");
        trs.forEach(el => el.remove());
      }

      let tfoot = table.querySelector("tfoot");
      let tHead = table.querySelector("tHead");
      const tfootTH = tfoot?.querySelector("tfoot th") as HTMLElement;
      const theadTH = tHead?.querySelector("thead th") as HTMLElement;
      tfoot?.remove();

      for (let j = 0; j < 3; j++) {
        const bodyRow = this.#renderer.createElement("tr");
        for (let i = 0; i < theads.length; i++) {
          const td = this.#renderer.createElement("td");
          this.#renderer.appendChild(td, this.#renderer.createText(`Example ${i + 1}`));
          this.#renderer.setStyle(td, 'border-width', tbodyTD?.style.borderWidth || '1px');
          this.#renderer.setStyle(td, 'border-style', tbodyTD?.style.borderStyle || 'dotted');
          this.#renderer.setStyle(td, 'border-color', tbodyTD?.style.borderColor || 'black');
          this.#renderer.setStyle(td, 'font-size', tbodyTD?.style.fontSize || '10px');
          this.#renderer.setStyle(td, 'padding', tbodyTD?.style.padding || '5px');
          this.#renderer.addClass(td, "remove-after");
          this.#renderer.appendChild(bodyRow, td);
        }
        this.#renderer.appendChild(tbody, bodyRow);
      }

      if (table.getAttribute("data-show-footer") === "true") {
        tfoot = this.#renderer.createElement("tfoot");
        const tr = this.#renderer.createElement("tr");
        this.#renderer.appendChild(tfoot, tr);

        for (let i = 0; i < theads.length; i++) {
          const th = this.#renderer.createElement("th");
          const theadTH = theads[i];
          this.#renderer.setStyle(th, 'border-width', theadTH.style.borderWidth || '1px');
          this.#renderer.setStyle(th, 'border-style', theadTH.style.borderWidth || 'dotted');
          this.#renderer.setStyle(th, 'border-color', theadTH.style.borderColor || 'black');
          this.#renderer.setStyle(th, 'text-align', theadTH.style.textAlign || 'black');
          this.#renderer.setStyle(th, 'font-size', theadTH.style.fontSize || '11px');
          this.#renderer.setStyle(th, 'padding', theadTH.style.padding || '5px');
          if (i === 0) th.innerText = "Footer";
          this.#renderer.appendChild(tr, th);
        }

        this.#renderer.appendChild(table, tfoot);
      }
    })
  }

  changeShowFooter(event: any) {
    const val = event.target.checked;
    const table = this.style.selectedElement() as HTMLTableElement;
    if (val) {
      const tfoot = this.#renderer.createElement("tfoot");

      const theads = table.querySelectorAll("thead tr");
      const tr = this.#renderer.createElement("tr");
      this.#renderer.appendChild(tfoot, tr);

      const ths = table.querySelectorAll("thead th");

      for (let i = 0; i < ths.length; i++) {
        const th = this.#renderer.createElement("th");
        this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().thBorderWidth || '1px');
        this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'dotted');
        this.#renderer.setStyle(th, 'border-color', this.style.elementStyle().thBorderColor || 'black');
        this.#renderer.setStyle(th, 'font-size', this.style.elementStyle().thFontSize || '11px');
        this.#renderer.setStyle(th, 'padding', '5px');
        if (i === 0) th.innerText = "Footer";
        this.#renderer.appendChild(tr, th);
      }

      this.#renderer.appendChild(table, tfoot);
    } else {
      let tfoot = table.querySelector("tfoot");
      tfoot?.remove();
    }

    this.style.changeShowFooter(event);
  }

  closeStylePart() {
    const el: any = document.querySelector(".flexi-report-style-part");
    el.style.display = "none";
    this.clearAllSelectedClass();
  }

  getObjectProperties(data: any[], prefix = ""): string[] {
    if (!data || data.length === 0) return [];

    const properties: string[] = ["index"];

    function extractProperties(obj: any, parentKey = "") {
      if (!obj || typeof obj !== "object") return;

      for (const key of Object.keys(obj)) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;
        properties.push(newKey);

        const value = obj[key];
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
          extractProperties(value[0], newKey);
        } else if (typeof value === "object" && value !== null) {
          extractProperties(value, newKey);
        }
      }
    }

    extractProperties(data[0]);

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
        property: th.getAttribute("data-bind") || "",
        textAlign: th.style.textAlign || "start",
        format: th.getAttribute("data-format") || "",
        footerValue: th.getAttribute("data-footer") || ""
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
      this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().thBorderWidth || '1px');
      this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'dotted');
      this.#renderer.setStyle(th, 'border-color', this.style.elementStyle().thBorderColor || 'black');
      this.#renderer.setStyle(th, 'font-size', this.style.elementStyle().thFontSize || '11px');
      this.#renderer.setStyle(th, 'width', head.width);
      this.#renderer.setStyle(th, 'text-align', head.textAlign);
      if (head.property) {
        this.#renderer.setAttribute(th, "data-bind", head.property);
      }
      if (head.format) {
        this.#renderer.setAttribute(th, "data-format", head.format);
      }
      if (head.footerValue) {
        this.#renderer.setAttribute(th, "data-footer", head.footerValue);
      }
      this.#renderer.appendChild(headerRow, th);
    });

    this.#renderer.setAttribute(table, "data-bind", "true");
  }

  addNewTableHead() {
    this.tableHeads.update(prev => [...prev, { value: "New Header", width: "auto", property: "" }]);
    this.updateTableHeads();

    const table = this.style.selectedElement() as HTMLTableElement;
    const tbody = table.querySelector("tbody");
    if (tbody) {
      const trs = tbody.querySelectorAll("tr");
      trs.forEach(row => {
        const td = this.#renderer.createElement("td");
        this.#renderer.setStyle(td, 'border-width', this.style.elementStyle().tdBorderWidth || '1px');
        this.#renderer.setStyle(td, 'border-style', this.style.elementStyle().tdBorderStyle || 'dotted');
        this.#renderer.setStyle(td, 'border-color', this.style.elementStyle().tdBorderColor || 'black');
        this.#renderer.setStyle(td, 'font-size', this.style.elementStyle().tdFontSize || '10px');
        this.#renderer.setStyle(td, 'padding', '5px');
        this.#renderer.setStyle(td, 'text-align', this.style.elementStyle().textAlign || 'start');
        this.#renderer.addClass(td, "remove-after");
        this.#renderer.appendChild(row, td);
      });
    }

    const tfoot = table.querySelector("tfoot");
    if(tfoot){
      const tr = tfoot.querySelector("tfoot tr");
      const th = this.#renderer.createElement("th");
      this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().thBorderWidth || '1px');
      this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'dotted');
      this.#renderer.setStyle(th, 'border-color', this.style.elementStyle().thBorderColor || 'black');
      this.#renderer.setStyle(th, 'font-size', this.style.elementStyle().thFontSize || '10px');
      this.#renderer.setStyle(th, 'padding', '5px');
      this.#renderer.setStyle(th, 'text-align', this.style.elementStyle().textAlign || 'start');
      this.#renderer.addClass(th, "remove-after");
      this.#renderer.appendChild(tr, th);
    }
  }

  deleteElement() {
    if (this.style.selectedElement()) {
      this.style.selectedElement()!.remove();
      this.closeStylePart();
    }
  }

  saveReport() {
    if (!this.pdfArea()) return;

    this.clearAllSelectedClass();
    this.closeStylePart();
    this.clear();

    const reportContent = this.elementArea().nativeElement.innerHTML;
    this.reportSignal.update(prev => ({
      ...prev,
      content: reportContent,
      sqlQuery: this.sqlQuery()
    }));
    this.onSave.emit(this.reportSignal());
  }

  loadReport() {
    if (!this.pdfArea() || !this.reportSignal()) return;
    if (this.reportSignal()!.content) {
      this.elementArea().nativeElement.innerHTML = this.reportSignal()!.content;
    }
    if(this.reportSignal()!.sqlQuery){
      this.sqlQuery.set(this.reportSignal().sqlQuery)
    }

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

  rgbStringToHex(rgb: string): string {
    const match = rgb.match(/\d+/g);
    if (!match || match.length !== 3) return "#000000"; // Geçersiz giriş için varsayılan değer

    const [r, g, b] = match.map(Number);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
  }

  changePageSetting() {
    if (this.reportSignal().pageOrientation === "portrait") {
      if (this.reportSignal().pageSize === "a4") {
        this.pageSetting.set({
          width: "794px",
          height: "1123px",
        });
      } else if (this.reportSignal().pageSize === "a5") {
        this.pageSetting.set({
          width: "559px",
          height: "794px"
        });
      }
      else if (this.reportSignal().pageSize === "a6") {
        this.pageSetting.set({
          width: "397px",
          height: "559px"
        });
      }
    } else if (this.reportSignal().pageOrientation === "landscape") {
      if (this.reportSignal().pageSize === "a4") {
        this.pageSetting.set({
          width: "1123px",
          height: "794px"
        });
      } else if (this.reportSignal().pageSize === "a5") {
        this.pageSetting.set({
          width: "794px",
          height: "559px"
        });
      }
      else if (this.reportSignal().pageSize === "a6") {
        this.pageSetting.set({
          width: "559px",
          height: "397px"
        });
      }
    }
  }

  zoomIn() {
    this.zoomValue.update(prev => prev += 0.1);
  }

  zoomOut() {
    if (this.zoomValue() > 0.2) {
      this.zoomValue.update(prev => prev -= 0.1);
    }
  }

  openDataResultPart(){
    this.dataResultPart().nativeElement.style.display = "block";
  }

  closeDataResultPart(){
    this.dataResultPart().nativeElement.style.display = "none";
  }

  openSqlQueryPart(){
    this.sqlQueryPart().nativeElement.style.display = "block";
  }

  closeSqlQueryPart(){
    this.sqlQueryPart().nativeElement.style.display = "none";
  }

  print() {
    const printContent = this.pdfArea().nativeElement.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow!.document.open();
    printWindow!.document.write(`
      <html>
        <head>
          <style>
            @media print {
              @page { size: ${this.reportSignal().pageSize.toUpperCase()} ${this.reportSignal().pageOrientation}; margin: 0; }
            }
            body { margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    printWindow!.document.close();
    printWindow!.print();
    printWindow!.close();
  }

  addThisWorkToSqlQuery(text:string){
    this.sqlQuery.update(prev => prev += text);
  }
}
