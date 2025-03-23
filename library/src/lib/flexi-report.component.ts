import { CdkDragDrop, DragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, linkedSignal, OnChanges, output, Renderer2, signal, SimpleChanges, viewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import jsPDF from 'jspdf';
import { StyleService } from './services/style.service';
import { TableSettingModel } from './models/table-setting.model';
import { FlexiButtonComponent } from 'flexi-button';
import { ReportModel } from './models/report.model';
import { FlexiTooltipDirective } from 'flexi-tooltip';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { FilterType, FlexiGridModule } from 'flexi-grid';
import { FlexiReportLoadingComponent } from './flexi-report-loading/flexi-report-loading.component';
import { AISqlQueryRequestModel } from './models/ai-sql-query-request.model';
import { initilizeRequestElementModel, RequestElementModel } from './models/request-element.model';
import { RequestModel } from './models/request.model';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { ElementModel } from '../public-api';
import { evaluate } from "mathjs";

@Component({
  selector: 'flexi-report',
  imports: [
    FormsModule,
    CommonModule,
    DragDropModule,
    FlexiButtonComponent,
    FlexiTooltipDirective,
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
  readonly data = input<any>();
  readonly language = input<"en" | "tr">("en");
  readonly report = input<ReportModel>();
  readonly isPreview = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly sqlQueryLoading = input<boolean>(false);
  readonly tablesData = input<any[]>();
  readonly openAPIKey = input<string>();
  readonly showEditButtn = input<boolean>(true);

  readonly showGrill = signal<boolean>(false);
  readonly date = signal<string>(this.getNowDate());
  readonly requestElement = signal<RequestElementModel>(initilizeRequestElementModel);
  readonly showAIHelpQuery = signal<boolean>(false);
  readonly sqlQueryLoadingSignal = linkedSignal(() => this.sqlQueryLoading())
  readonly aiSqlQueryRequest = signal<AISqlQueryRequestModel>(new AISqlQueryRequestModel());
  readonly loadingSignal = linkedSignal(() => this.loading());
  readonly zoomValue = linkedSignal<number>(() => this.isPreview() ? 1 : 0.8);
  readonly pageSetting = signal<{ width: string, height: string }>({ width: "794px", height: "1123px" });
  readonly reportSignal = linkedSignal(() => this.report() ?? new ReportModel());
  readonly elements = signal<ElementModel[]>([
    { name: "div", title: "DIV" },
    { name: "h1", title: "HEAD" },
    { name: "span", title: "SPAN" },
    { name: "horizontal-line", title: "HORIZONTAL LINE" },
    { name: "vertical-line", title: "VERTICAL LINE" },
    { name: "hr", title: "HR" },
    { name: "img", title: "IMG" },
    // { name: "icon", title: "ICON"},
    { name: "table", title: "TABLE" },
    { name: "single_table", title: "SINGLE TABLE" },
  ]);
  readonly formats = signal<string[]>([
    "n",
    "c",
    "c0",
    "c2",
    "c4",
    "dd MM yyyy",
    "dd MM yyyy HH:mm",
    "dd MM yyyy HH:mm:ss",
    "dd.MM.yyyy",
    "dd.MM.yyyy HH:mm",
    "dd.MM.yyyy HH:mm:ss"
  ])
  readonly tableHeads = signal<TableSettingModel[]>([]);
  readonly elementBind = signal<string>("");
  readonly listProperties = computed(() => this.getListObjectProperties(this.listData() ?? []));
  readonly singleProperties = computed(() => this.getSingleObjectProperties(this.singleData() ?? {}));
  readonly showProperties = signal<boolean>(false);
  readonly showPageSettings = signal<boolean>(false);
  readonly showElements = signal<boolean>(true);
  readonly formKeys = computed(() => this.reportSignal().requestElements === null ? [] :  Object.keys(this.reportSignal().requestElements!.reduce<{ [key: string]: any }>((acc, elem) => {
    acc[elem.name] = '';
    return acc;
  }, {})));

  readonly singleData = computed(() => this.processData(this.data()).singleData);
  readonly listData = computed(() => this.processData(this.data()).listData);
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
  readonly requestFormsText = computed(() => this.language() === "en" ? "Request Forms" : "İstek Formu");
  readonly noRequestElementsText = computed(() => this.language() === "en" ? "No request elements added" : "İstek için eklenen bir element yok");
  readonly openRequestParamsText = computed(() => this.language() === "en" ? "Open request params form" : "İstek formunu aç");
  readonly getReportText = computed(() => this.language() === "en" ? "Get report" : "Raporu getir");
  readonly exportToExcelText = computed(() => this.language() === "en" ? "Export to Excel" : "Excel'e Aktar");
  readonly pageBackgroundColorText = computed(() => this.language() === "en" ? "Page BG Color" : "Page BG Color");
  readonly showGrillText = computed(() => this.language() === "en" ? "Show Grill" : "Izgara Görünümü");
  readonly downloadAsJsonText = computed(() => this.language() === "en" ? "Download as JSON" : "Raporu JSON olarak İndir");
  readonly updateJsonText = computed(() => this.language() === "en" ? "Upload report as JSON" : "Raporu JSON olarak yükle");
  readonly reportUploadSucceedText = computed(() => this.language() === "en" ? "Report upload successful" : "Rapor başarıyla yüklendi");
  readonly reportUploadFailedText = computed(() => this.language() === "en" ? "Report upload failed" : "Raporu yükleme başarısız oldu");
  readonly updateText = computed(() => this.language() === "en" ? "Update" : "Güncelle");
  readonly sqlQueryText = computed(() => this.language() === "en" ? "Sql Query" : "Sql Query");

  readonly elementArea = viewChild.required<ElementRef>("elementArea");
  readonly pdfArea = viewChild.required<ElementRef>('pdfArea');
  readonly stylePart = viewChild.required<ElementRef>("stylePart");
  readonly dataResultPart = viewChild.required<ElementRef>("dataResultPart");
  readonly sqlQueryPart = viewChild.required<ElementRef>("sqlQueryPart");
  readonly requestElementPart = viewChild.required<ElementRef>("requestElementPart");

  readonly onSave = output<any>();
  readonly onEdit = output<any>();
  readonly onUpdate = output<any>();
  readonly onDelete = output<any>();
  readonly onNewReport = output<void>();
  readonly onSendRequest = output<any>();

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

    if(this.isPreview()){
      const els = this.pdfArea().nativeElement.querySelectorAll(".flexi-report-cursor-move");
      els.forEach((el:HTMLElement) => {
        el.classList.remove("flexi-report-cursor-move");
        el.classList.add("flexi-report-cursor-pointer");
      })
    }
  }

  getNowDate() {
    let day = new Date().getDate().toString();
    if (day.length === 1) day = "0" + day;

    let month = (new Date().getMonth() + 1).toString();
    if (month.length === 1) month = "0" + month;

    const year = new Date().getFullYear().toString();

    const date = year + "-" + month + "-" + day;
    return date;
  }

  processData(data: any) {
    let singleData: any = null;
    let listData: any[] = [];

    if (Array.isArray(data)) {
      listData = data;
    } else if (typeof data === "object" && data !== null) {
      singleData = { ...data };

      for (const key in singleData) {
        if (Array.isArray(singleData[key])) {
          listData = singleData[key];
          delete singleData[key];
          break;
        }
      }
    }

    return { singleData, listData };
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
        textDecoration: newElement.style.textDecoration || "none",
        property: newElement.getAttribute("data-property") || "",
        calculation: newElement.getAttribute("data-calculation") || "",
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

      if(type === "single_table"){
        const th = newElement.querySelector("th") as HTMLElement;
        this.style.elementStyle.update(prev => ({
          ...prev,
          thWidth: th?.style.width || "auto",
          thFontSize: th?.style.fontSize || "11px",
        }));

        const td = newElement.querySelector("td");
        this.style.elementStyle.update(prev => ({
          ...prev,
          tdWidth: td?.style.width || "auto",
          tdFontSize: td?.style.fontSize || "10px",
        }));

        this.style.elementStyle.update(prev => ({
          ...prev,
          trBorderWidth: th?.style.borderWidth,
          trBorderStyle: th?.style.borderStyle,
          trBorderColor: this.style.elementStyle().trBorderColor || this.rgbStringToHex(th.style.borderColor)
        }));

        this.getTableForSingleTable(newElement);
      }
    });
  }

  addElement(type: string) {
    if (!this.elementArea()) return;
    let newElement: HTMLElement | null = null;

    if (type == "h1") {
      newElement = this.createHeading(type);
    } else if (type === "span") {
      newElement = this.createSpan();
    } else if (type === "div") {
      newElement = this.createDiv();
    } else if (type === "horizontal-line") {
      newElement = this.createLine("horizontal");
    } else if (type === "vertical-line") {
      newElement = this.createLine("vertical");
    } else if (type === "hr") {
      newElement = this.createHr();
    } else if (type === "img") {
      newElement = this.createImage();
    } else if (type === "icon") {
      newElement = this.createIcon();
    } else if (type === "table") {
      newElement = this.createTable();
    } else if (type === "single_table") {
      newElement = this.createSingleTable();
    }

    if (!newElement) return;

    newElement.classList.add("draggable");
    newElement.setAttribute('data-type', type);
    this.attachClickListener(newElement, type);

    this.#renderer.addClass(newElement, "flexi-report-cursor-move");
    this.#renderer.appendChild(this.elementArea().nativeElement, newElement);

    this.#dragDrop.createDrag(newElement);
  }

  createHeading(type: string): HTMLElement {
    const heading = this.#renderer.createElement(type);
    const text = this.#renderer.createText("Title");
    this.#renderer.appendChild(heading, text);
    this.#renderer.setStyle(heading, 'width', 'fit-content');
    this.#renderer.setStyle(heading, 'font-size', '20px');
    return heading;
  }

  createSpan(): HTMLElement {
    const span = this.#renderer.createElement("span");
    const text = this.#renderer.createText("span");
    this.#renderer.appendChild(span, text);
    this.#renderer.setStyle(span, 'display', 'inline-block');
    return span;
  }

  createDiv(): HTMLElement {
    const div = this.#renderer.createElement("div");
    this.#renderer.setStyle(div, 'display', 'block');
    this.#renderer.setStyle(div, 'width', '100px');
    this.#renderer.setStyle(div, 'height', '100px');
    this.#renderer.setStyle(div, 'border-width', '1px');
    this.#renderer.setStyle(div, 'border-style', 'solid');
    this.#renderer.setStyle(div, 'border-color', '#000000');
    this.#renderer.setStyle(div, 'backgroundColor', '#ffffff');
    return div;
  }

  createIcon(): HTMLElement {
    const span = this.#renderer.createElement("span") as HTMLElement;
    span.innerText = "settings_accessibility"
    this.#renderer.setStyle(span, 'display', 'inline-block');
    this.#renderer.addClass(span, 'material-symbols-outlined');
    this.#renderer.setAttribute(span, "data-name", "icon");
    return span;
  }

  createLine(orientation: 'horizontal' | 'vertical'): HTMLElement {
    const line = this.#renderer.createElement("div");
    this.#renderer.setStyle(line, 'position', 'absolute');
    this.#renderer.setStyle(line, 'backgroundColor', '#000');
    this.#renderer.setStyle(line, 'cursor', 'move');
    this.#renderer.addClass(line, 'draggable');

    if (orientation === 'horizontal') {
      this.#renderer.setStyle(line, 'width', '100px');
      this.#renderer.setStyle(line, 'height', '2px');
    } else {
      this.#renderer.setStyle(line, 'width', '2px');
      this.#renderer.setStyle(line, 'height', '100px');
    }

    this.attachClickListener(line, 'line');
    return line;
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
    this.#renderer.setStyle(table, 'width', '98%');
    this.#renderer.addClass(table, "flexi-report-page-table");
    this.#renderer.setAttribute(table, "data-name", "table");

    const thead = this.#renderer.createElement("thead");
    this.#renderer.appendChild(table, thead);

    const headerRow = this.#renderer.createElement("tr");
    for (let i = 0; i < 3; i++) {
      const th = this.#renderer.createElement("th");
      this.#renderer.appendChild(th, this.#renderer.createText(`Header ${i + 1}`));
      this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().thBorderWidth || '1px');
      this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'solid');
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
        this.#renderer.setStyle(td, 'border-width', this.style.elementStyle().tdBorderWidth || '1px');
        this.#renderer.setStyle(td, 'border-style', this.style.elementStyle().tdBorderStyle || 'solid');
        this.#renderer.setStyle(td, 'border-color', this.style.elementStyle().tdBorderColor || 'black');
        this.#renderer.setStyle(td, 'font-size', this.style.elementStyle().tdFontSize || '10px');
        this.#renderer.setStyle(td, 'padding', '5px');
        this.#renderer.addClass(td, "remove-after");
        this.#renderer.appendChild(bodyRow, td);
      }
      this.#renderer.appendChild(tbody, bodyRow);
    }

    return table;
  }

  createSingleTable(): HTMLElement{
    const table = this.#renderer.createElement("table");
    this.#renderer.setStyle(table, 'border-collapse', 'collapse');
    this.#renderer.setStyle(table, 'width', '40%');
    this.#renderer.setAttribute(table, "data-name", "single_table");

    const tr = this.#renderer.createElement("tr");
    this.#renderer.appendChild(table, tr);

    const th:HTMLElement = this.#renderer.createElement("th");
    th.innerText = "Header";
    this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().trBorderWidth || '1px');
    this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().trBorderStyle || 'solid');
    this.#renderer.setStyle(th, 'border-color', this.style.elementStyle().trBorderColor || 'black');
    this.#renderer.setStyle(th, 'font-size', this.style.elementStyle().thFontSize || '11px');
    this.#renderer.setStyle(th, "vertical-align", "top");
    this.#renderer.setStyle(th, "text-align", "start");
    this.#renderer.setStyle(th, 'padding', '5px');
    this.#renderer.appendChild(tr, th);

    const td:HTMLElement = this.#renderer.createElement("td");
    td.innerText = "Header";
    this.#renderer.setStyle(td, 'border-width', this.style.elementStyle().trBorderWidth || '1px');
    this.#renderer.setStyle(td, 'border-style', this.style.elementStyle().trBorderStyle || 'solid');
    this.#renderer.setStyle(td, 'border-color', this.style.elementStyle().trBorderColor || 'black');
    this.#renderer.setStyle(td, 'font-size', this.style.elementStyle().tdFontSize || '10px');
    this.#renderer.setStyle(td, "vertical-align", "top");
    this.#renderer.setStyle(td, "text-align", "start");
    this.#renderer.setStyle(td, 'padding', '5px');
    this.#renderer.appendChild(tr, td);

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

    this.showGrill.set(false);
    this.pdfArea().nativeElement.style.backgroundColor = this.reportSignal().backgroundColor || "#ffffff";

    this.preview();
    this.loadingSignal.set(true);

    await new Promise(resolve => setTimeout(resolve, 100));
    const pageWidth = +this.pageSetting().width.replace("px", "");
    const pageHeight = +this.pageSetting().height.replace("px", "");
    const padding = 20;
    const bgColor = this.reportSignal().backgroundColor || "#ffffff";

    const pdf = new jsPDF({
      orientation: this.reportSignal().pageOrientation,
      unit: 'px',
      format: [pageWidth + padding * 2, pageHeight + padding * 2]
    });

    let ttfLink = "https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf";
    let fontName = "Roboto";

    pdf.setFillColor(bgColor);
    pdf.rect(0, 0, pageWidth + padding * 2, pageHeight + padding * 2, "F");

    pdf.addFont(ttfLink, fontName, "normal");
    pdf.setFont(fontName);

    pdf.html(this.pdfArea().nativeElement, {
      callback: (doc) => {
        doc.save('report.pdf');
      },
      x: padding,
      y: padding,
      width: pageWidth,
      windowWidth: pageWidth + padding * 2
    });

    this.loadingSignal.set(false);
  }

  preview() {
    this.showGrill.set(false);
    if (this.singleData()) {
      const els = this.pdfArea().nativeElement.querySelectorAll("[data-property], [data-calculation]");
      els.forEach((el: HTMLElement) => {
        const calculation = el.getAttribute("data-calculation");
        const property = el.getAttribute("data-property") || "";

        let value: any = "";

        if (calculation) {
          value = this.calculateFormula(this.singleData(), calculation);
          value = this.formatValue(value, "n");
        } else if (property) {
          value = this.getNestedValue(this.singleData(), property, "");
          //if (!isNaN(value)) value = Number(value).toLocaleString();
        }

        el.innerText = value !== undefined ? value : "";
      });
    }

    this.prepareTableBind();
  }

  calculateFormula(data: any, formula: string): number | string {
    const formulaReplaced = formula.replace(/[a-zA-Z0-9_.]+/g, match => {
      const val = this.getNestedValue(data, match.trim());
      return !isNaN(val) && val !== "" ? val : '0';
    });

    try {
      return evaluate(formulaReplaced);
    } catch {
      return "Nan";
    }
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
        calculation: th.getAttribute("data-calculation") || ""
      }));

      this.listData()!.forEach((res, i) => {
        const row = this.#renderer.createElement("tr");
        row.classList.add("remove-after");

        headers.forEach(header => {
          const cell = this.#renderer.createElement("td");
          cell.style.borderWidth = tdBorderWidth;
          cell.style.borderStyle = tdBorderStyle;
          cell.style.borderColor = tdBorderColor;
          cell.style.fontSize = tdFontSize;
          cell.style.textAlign = header.textAlign;
          cell.style.padding = "5px";
          let value = header.property ? (header.property === "index" ? i + 1 : this.getNestedValue(res, header.property) || "") : "";
          if (header.format) {
            value = this.formatValue(value, header.format);
          }
          if (header.calculation){
            let calculationValue = this.calculateFormula(res,header.calculation);
            value = this.formatValue(calculationValue,header.format);
          }
          this.#renderer.appendChild(cell, this.#renderer.createText(value));
          this.#renderer.appendChild(row, cell);
        });
        this.#renderer.appendChild(tbody, row);
      });

      if (table.getAttribute("data-show-footer") === "true" && this.listData()) {
        const tfoot = this.#renderer.createElement("tfoot");
        const footerRow = this.#renderer.createElement("tr");
        this.#renderer.appendChild(tfoot, footerRow);;

        headers.forEach((header, index) => {
          const footerCell = this.#renderer.createElement("th");
          let value = header.footerValue;
          if (value === "sum") {
            let total = 0;
            if(header.property){
              this.listData()!.forEach(res => {
                total += +res[header.property];
              });
            }
            if(header.calculation){
              this.listData()!.forEach(res => {
                let calculationValue = this.calculateFormula(res,header.calculation);
                total += +calculationValue;
              });
            }
            value = this.formatValue(total.toString(), header.format);
          } else if (value === "average") {
            let total = 0;
            this.listData()!.forEach(res => {
              total += +res[header.property];
            })
            total = total / this.listData()!.length
            value = this.formatValue(total.toString(), header.format);
          }
          const theadTH = headers[index];
          this.#renderer.appendChild(footerCell, this.#renderer.createText(value));
          this.#renderer.setStyle(footerCell, 'border-width', theadTH.borderWidth || '1px');
          this.#renderer.setStyle(footerCell, 'border-style', theadTH.borderStyle || 'solid');
          this.#renderer.setStyle(footerCell, 'border-color', theadTH.borderColor || 'black');
          this.#renderer.setStyle(footerCell, 'text-align', theadTH.textAlign || 'start');
          this.#renderer.setStyle(footerCell, 'font-weight', 'bold');
          this.#renderer.setStyle(footerCell, 'font-size', theadTH.fontSize || '11px');
          this.#renderer.setStyle(footerCell, 'padding', '5px');
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
      let decimalPart = 2;
      if(format.toLowerCase().startsWith('n')) decimalPart = 0;
      if(format.toLowerCase().endsWith('0')) decimalPart = 0;
      if(format.toLowerCase().endsWith('2')) decimalPart = 2;
      if(format.toLowerCase().endsWith('4')) decimalPart = 4;
      const decimals = parseInt(format.substring(1), 10) || decimalPart;
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
    const els = this.pdfArea().nativeElement.querySelectorAll("[data-property], [data-calculation]");
    els.forEach((el: HTMLElement) => {
      const value = el.getAttribute("data-value") || "No value";
      el.innerText = value
    });

    let tables = this.pdfArea().nativeElement.querySelectorAll('table[data-name="table"]');
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
          this.#renderer.setStyle(td, 'border-style', tbodyTD?.style.borderStyle || 'solid');
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
          this.#renderer.setStyle(th, 'border-style', theadTH.style.borderWidth || 'solid');
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
        this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'solid');
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

  getListObjectProperties(data: any[], prefix = ""): string[] {
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

  getSingleObjectProperties(data: any, prefix = ""): string[] {
    if (!data || typeof data !== "object") return [];

    const properties: string[] = [];

    function extractProperties(obj: any, parentKey = "") {
      if (!obj || typeof obj !== "object") return;

      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const newKey = parentKey ? `${parentKey}.${key}` : key;

        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          extractProperties(value, newKey);
        } else {
          properties.push(newKey);
        }
      }
    }

    extractProperties(data);

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
        calculation: th.getAttribute("data-calculation") || "",
        footerValue: th.getAttribute("data-footer") || "",
      });
    });

    this.tableHeads.set(headers);
  }

  getTableForSingleTable(element:HTMLElement){
    const headers: TableSettingModel[] = [];
    const els = element.querySelectorAll("th, td") as NodeListOf<HTMLElement>;

    els.forEach((el) => {
      headers.push({
        value: el.innerText.trim(),
        width: el.style.width || "auto",
        property: el.getAttribute("data-property") || "",
        textAlign: el.style.textAlign || "start",
        format: el.getAttribute("data-format") || "",
        calculation: el.getAttribute("data-calculation") || "",
        footerValue: el.getAttribute("data-footer") || "",
        el: el
      });
    });

    this.tableHeads.set(headers);
  }

  deleteTableHead(index: number) {
    if(this.style.elementName() === "table"){
      this.tableHeads().splice(index, 1);
      const tbodyTrs = this.pdfArea().nativeElement.querySelectorAll("tbody tr");
      tbodyTrs.forEach((tr:HTMLElement) => {
        const tds = tr.querySelectorAll("td");
        tds[index].remove();
      });

      const tfootTr = this.pdfArea().nativeElement.querySelector("tfoot tr");
      if(tfootTr){
        const ths = tfootTr.querySelectorAll("th");
        ths[index].remove();
      }
      this.updateTableHeads();
    }else{
      const head = {...this.tableHeads()[index]};
      if(head.el!.tagName === "TH"){
        this.tableHeads().splice(index, 2);
      }else{
        this.tableHeads().splice(index - 1, 2);
      }
      const tr = head.el!.parentElement as HTMLTableRowElement;
      tr.remove();
    }
  }

  updateTableHead(value:any){
    if(this.style.elementName() === "table"){
      this.updateTableHeads();
    }else{
      this.updateTableForSingleTable(value);
    }
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
      this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'solid');
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
      if (head.calculation){
        this.#renderer.setAttribute(th, "data-calculation", head.calculation);
      }
      this.#renderer.appendChild(headerRow, th);
    });

    this.#renderer.setAttribute(table, "data-bind", "true");
  }

  updateTableForSingleTable(data:TableSettingModel){
    data.el!.innerText = data.value;
    data.el!.setAttribute("data-value",data.value!);
    if(data.property){
      data.el!.setAttribute("data-property",data.property!);
    }
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
        this.#renderer.setStyle(td, 'border-style', this.style.elementStyle().tdBorderStyle || 'solid');
        this.#renderer.setStyle(td, 'border-color', this.style.elementStyle().tdBorderColor || 'black');
        this.#renderer.setStyle(td, 'font-size', this.style.elementStyle().tdFontSize || '10px');
        this.#renderer.setStyle(td, 'padding', '5px');
        this.#renderer.setStyle(td, 'text-align', this.style.elementStyle().textAlign || 'start');
        this.#renderer.addClass(td, "remove-after");
        this.#renderer.appendChild(row, td);
      });
    }

    const tfoot = table.querySelector("tfoot");
    if (tfoot) {
      const tr = tfoot.querySelector("tfoot tr");
      const th = this.#renderer.createElement("th");
      this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().thBorderWidth || '1px');
      this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().thBorderStyle || 'solid');
      this.#renderer.setStyle(th, 'border-color', this.style.elementStyle().thBorderColor || 'black');
      this.#renderer.setStyle(th, 'font-size', this.style.elementStyle().thFontSize || '10px');
      this.#renderer.setStyle(th, 'padding', '5px');
      this.#renderer.setStyle(th, 'text-align', this.style.elementStyle().textAlign || 'start');
      this.#renderer.addClass(th, "remove-after");
      this.#renderer.appendChild(tr, th);
    }
  }

  addNewTableHeadForSingleTable(){
    const table = this.style.selectedElement() as HTMLTableElement;

    const tr = this.#renderer.createElement("tr");
    this.#renderer.appendChild(table, tr);

    const th:HTMLElement = this.#renderer.createElement("th");
    th.innerText = "New Header";
    this.#renderer.setStyle(th, "width", this.style.elementStyle().thWidth || "auto");
    this.#renderer.setStyle(th, 'border-width', this.style.elementStyle().trBorderWidth || '1px');
    this.#renderer.setStyle(th, 'border-style', this.style.elementStyle().trBorderStyle || 'solid');
    this.#renderer.setStyle(th, 'border-color', this.style.elementStyle().trBorderColor || 'black');
    this.#renderer.setStyle(th, 'font-size', this.style.elementStyle().thFontSize || '11px');
    this.#renderer.setStyle(th, "text-align", "start");
    this.#renderer.setStyle(th, "vertical-align", "top");
    this.#renderer.setStyle(th, 'padding', '5px');
    this.#renderer.appendChild(tr, th);
    this.tableHeads.update(prev => [...prev, { value: "New Header", width: "auto", property: "", el: th }]);

    const td:HTMLElement = this.#renderer.createElement("td");
    td.innerText = "New Header";
    this.#renderer.setStyle(td, "width", this.style.elementStyle().tdWidth || "auto");
    this.#renderer.setStyle(td, 'border-width', this.style.elementStyle().trBorderWidth || '1px');
    this.#renderer.setStyle(td, 'border-style', this.style.elementStyle().trBorderStyle || 'solid');
    this.#renderer.setStyle(td, 'border-color', this.style.elementStyle().trBorderColor || 'black');
    this.#renderer.setStyle(td, 'font-size', this.style.elementStyle().tdFontSize || '10px');
    this.#renderer.setStyle(td, "text-align", "start");
    this.#renderer.setStyle(td, "vertical-align", "top");
    this.#renderer.setStyle(td, 'padding', '5px');
    this.#renderer.appendChild(tr, td);
    this.tableHeads.update(prev => [...prev, { value: "New Header", width: "auto", property: "", el: td }]);
  }

  deleteElement() {
    if (this.style.selectedElement()) {
      this.style.selectedElement()!.remove();
      this.closeStylePart();
    }
  }

  saveReport(type: "save" | "update" | "download") {
    if (!this.pdfArea()) return;

    this.clearAllSelectedClass();
    this.closeStylePart();
    this.clear();

    const reportContent = this.elementArea().nativeElement.innerHTML;
    this.reportSignal.update(prev => ({
      ...prev,
      content: reportContent,
      sqlQuery: this.reportSignal().sqlQuery
    }));

    if (type === "save") {
      this.onSave.emit(this.reportSignal());
    }

    if (type === "update") {
      this.onUpdate.emit(this.reportSignal());
    }

    if (type === "download") {
      this.downloadJSON(this.reportSignal(), "report.json");
    }

  }

  downloadJSON(data: any, filename: string) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  loadReport() {
    if (!this.pdfArea() || !this.reportSignal()) return;
    if (this.reportSignal()!.content) {
      this.elementArea().nativeElement.innerHTML = this.reportSignal()!.content;
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

  openDataResultPart() {
    this.dataResultPart().nativeElement.style.display = "block";
  }

  closeDataResultPart() {
    this.dataResultPart().nativeElement.style.display = "none";
  }

  openSqlQueryPart() {
    this.sqlQueryPart().nativeElement.style.display = "block";
  }

  closeSqlQueryPart() {
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

  addThisWorkToSqlQuery(text: string) {
    this.reportSignal().sqlQuery += text;
  }

  async askAIForSqlQuery() {
    this.aiSqlQueryRequest.update(prev => ({
      ...prev,
      apiKey: this.openAPIKey() ?? "",
      schema: JSON.stringify(this.tablesData())
    }));

    const headers = {
      'Authorization': `Bearer ${this.openAPIKey()}`,
      'Content-Type': 'application/json'
    };
    this.sqlQueryLoadingSignal.set(true);

    const requestBody = {
      model: this.aiSqlQueryRequest().model,
      messages: [
        {
          role: "system",
          content: `
                  You are a SQL expert specialized strictly in Microsoft SQL Server (MSSQL).
                  Using the provided database schema, generate the most performant, optimized, and valid MSSQL query that accurately fulfills the user's request.
                  Your response must ONLY contain the pure SQL query for MSSQL.
                  Do NOT include quotes, code blocks, markdown, special characters, or explanations of any kind.
                  Always use TOP syntax for row limiting in MSSQL.
                  Database schema: ${this.aiSqlQueryRequest().schema}
              `
        },
        {
          role: "user",
          content: this.aiSqlQueryRequest().prompt
        }
      ]
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      body: JSON.stringify(requestBody),
      method: "POST",
      headers: headers
    })
    .then(res => res.json())
    .catch(() => {
      this.sqlQueryLoadingSignal.set(false);
      return null;
    });

    if (res) {
      this.sqlQueryLoadingSignal.set(false);
      this.reportSignal().sqlQuery = res.choices?.[0]?.message?.content || "";
    }
  }

  setProperty(event: any) {
    const value = event.target.value;

    if (value) {
      this.style.selectedElement()?.setAttribute("data-property", value);
    } else {
      this.style.selectedElement()?.removeAttribute("data-property");
    }
  }

  setCalculation(event: any) {
    const value = event.target.value;

    if (value) {
      this.style.selectedElement()?.setAttribute("data-calculation", value);
    } else {
      this.style.selectedElement()?.removeAttribute("data-calculation");
    }
  }

  findFilterType(val: any): FilterType {
    const type = typeof (val);
    if (type === "number") return "number";
    return "text";
  }

  addRequestElement() {
    const currentElements = this.reportSignal().requestElements || [];
    const newIndex = currentElements.length;

    const newElement: RequestElementModel = {
      ...this.requestElement(),
      index: newIndex
    };

    this.reportSignal.update(prev => ({
      ...prev,
      requestElements: [...prev.requestElements || [], newElement]
    }));

    this.requestElement.set(initilizeRequestElementModel);
  }

  removeRequestElement(name: string) {
    const elements = this.reportSignal().requestElements!
      .filter(p => p.name !== name)
      .map((element, index) => ({ ...element, index }));

    this.reportSignal.update(prev => ({
      ...prev,
      requestElements: elements
    }));
  }

  openRequestElementPart() {
    this.requestElementPart().nativeElement.style.display = "block";
  }

  closeRequestElementPart() {
    this.requestElementPart().nativeElement.style.display = "none";
  }

  sendRequest(form: NgForm) {
    let data: RequestModel = new RequestModel();

    if (this.reportSignal().endpoint) {
      data.endpoint = this.reportSignal().endpoint;
      data.params = form.value;

      Object.keys(form.value).forEach(key => {
        let value = form.value[key];
        if (value === '' || value === null || value === undefined) {
          value = null;
        } else if (!isNaN(value) && value.toString().trim() !== '') {
          form.value[key] = +value
        } else {
          form.value[key] = value
        }
      });

      this.onSendRequest.emit(data);
    } else if (this.reportSignal().sqlQuery) {
      let query = this.reportSignal().sqlQuery

      Object.keys(form.value).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        let value = form.value[key];

        if (value === '' || value === null || value === undefined) {
          value = null;
        } else if (!isNaN(value) && value.toString().trim() !== '') {
          value = value;
        } else {
          value = `'${value}'`;
        }

        query = query.replace(regex, value);
      });

      data.sqlQuery = query;

      this.onSendRequest.emit(data);
    }

    this.closeRequestElementPart();
  }

  onDropForRequestElements(event: CdkDragDrop<RequestElementModel[]>) {
    const elements = [...this.reportSignal().requestElements || []];

    moveItemInArray(elements, event.previousIndex, event.currentIndex);
    elements.forEach((element, index) => element.index = index);

    this.reportSignal.update(prev => ({
      ...prev,
      requestElements: elements
    }));
  }

  addToQuery(key: string) {
    this.reportSignal.update(prev => ({
      ...prev,
      sqlQuery: prev.sqlQuery ? `${prev.sqlQuery} {${key}}` : `{${key}}`
    }));
  }

  onDropForTableHeads(event: CdkDragDrop<TableSettingModel[]>) {
    const headers = [...this.tableHeads()];
    moveItemInArray(headers, event.previousIndex, event.currentIndex);
    this.tableHeads.set(headers);
    this.updateTableHeads();
  }

  exportToExcel() {
    if (!this.listData() || this.listData().length === 0) {
      alert('No data available to export.');
      return;
    }

    this.showGrill.set(false);

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.listData());
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");

    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data: Blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "Report.xlsx");
  }

  uploadReport(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);

        this.reportSignal.set(jsonData);
        this.changePageSetting();

        if (this.elementArea() && jsonData.content) {
          this.elementArea().nativeElement.innerHTML = jsonData.content;
          this.restoreDragFeature();
        }

        alert(this.reportUploadSucceedText());
      } catch (error) {
        alert(this.reportUploadFailedText());
      }
    };

    reader.readAsText(file);
  }
}