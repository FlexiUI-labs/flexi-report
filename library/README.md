# Flexi Report

Flexi Report is a dynamic Angular standalone component designed to easily create, style, and manage interactive reports and export them as PDFs. It offers robust functionalities, including dynamic content management, custom styling, and comprehensive table manipulation.

## Live Demo

Check out a live demo on <a href="https://stackblitz.com/edit/stackblitz-starters-1e3ed8qu?file=package.json">StackBlitz</a>.

## Features

- **Dynamic Content**: Easily add, rearrange, and configure report elements dynamically.
- **Interactive Styling Panel**: Control fonts, colors, alignments, margins, padding, borders, and more.
- **Table Customization**: Full control over headers, data binding, formatting, and dynamic footer calculations (e.g., sum, average).
- **SQL Query Execution**: Directly execute SQL queries within the component to populate report tables dynamically.
- **AI Integration**: Generate SQL queries using OpenAI integration for optimized database queries.
- **PDF Export and Print**: Export reports as PDF files or print directly from the interface with configurable padding and layout.
- **Drag & Drop Support**: Rearrange table headers and form elements using Angular CDK DragDrop.
- **Page Configuration**: Customize page size (A4, A5, A6), orientation (portrait, landscape), background color, and fonts.
- **Request Forms**: Define input fields like text, date, and select options to generate dynamic request forms for filtering reports.
- **Data Binding**: Supports binding elements to API endpoints or manually entered SQL queries for dynamic content population.
- **Excel Export**: Export report data directly to an Excel file.

## Installation

Install via npm:

```bash
npm install flexi-report
```

## Usage

Import the `FlexiReportComponent` directly into your standalone Angular component:

```typescript
import { FlexiReportComponent } from 'flexi-report';

@Component({
  imports: [FlexiReportComponent]
})
export class YourComponent {}
```

Use it in your template:

```html
<flexi-report
      [data]="data()"
      [report]="report()"
      [loading]="loading()"
      [openAPIKey]="openAPIKey()"
      [isPreview]="isPreview()"
      [sqlQueryLoading]="sqlQueryLoadingSignal()"
      [tablesData]="tablesData()"
      (onSave)="onSave($event)"
      (onEdit)="onEdit($event)"
      (onUpdate)="onUpdate($event)"
      (onDelete)="onDelete($event)"
      (onNewReport)="onNewReport()"
      (onSendRequest)="onSendRequest($event)"
/>
```

## Inputs

| Input                   | Type           | Description                                      |
| ----------------------- | -------------- | ------------------------------------------------ |
| `data`                  | `any[]`        | Data array for binding and displaying in reports |
| `language`              | `'en' \| 'tr'` | Language selection (English or Turkish)          |
| `report`                | `ReportModel`  | Report configuration model                       |
| `isPreview`             | `boolean`      | Toggle between preview and edit modes            |
| `loading`               | `boolean`      | Indicates loading state for general content      |
| `sqlQueryLoadingSignal` | `boolean`      | Loading indicator for SQL query execution        |
| `tablesData`            | `any[]`        | Data used to populate SQL query tables           |
| `openAPIKey`            | `string`       | API key for AI-based SQL query generation        |

## Outputs

| Output        | Event Type          | Description                              |
| ------------- | ------------------- | ---------------------------------------- |
| `onSave`      | `any`               | Emits the report content when saved      |
| `onEdit`      | `any`               | Emits the report content when clicked edit button      |
| `onUpdate`    | `any`               | Emits the report content when updated      |
| `onDelete`    | `any`               | Emits the ID of the report to be deleted |
| `onNewReport` | `void`              | Initiates a new report creation process  |
| `onSendRequest` | `object`          | Emits request parameters or SQL query when executed   |

## Supported Elements

- Div (`DIV`)
- Head (`H1`)
- Span (`SPAN`)
- Horizontal Line (`DIV`)
- Vertical Line (`DIV`)
- HR (`HR`)
- Image (`IMG`)
- Table (`TABLE`)

## Page Configuration

- **Sizes**: A4, A5, A6
- **Orientation**: Portrait, Landscape
- **Background Colors**: Selectable background color for reports.
- **Fonts**: Customizable font families, sizes, and weights through Google Fonts.
- **Grill Display**: Toggle grid visibility for alignment.

## AI-Generated SQL Queries

Flexi Report allows AI-powered SQL query generation using OpenAI. Provide an API key and dynamically generate optimized queries based on provided schema.

## Drag & Drop Functionality

- Rearrange **table headers** and **form elements** dynamically using drag-and-drop.
- Move elements within the report layout easily.
- Dedicated **drag handle** for table headers to prevent accidental rearrangements.
- Drag & drop functionality for **report styling panel**.

## Export Features

- **PDF Export**: Save reports as PDFs with formatted content.
- **Excel Export**: Export report data directly to an Excel file.
- **JSON Import/Export**: Load and save reports as JSON files.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT