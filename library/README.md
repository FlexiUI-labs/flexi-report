# Flexi Report

Flexi Report is a dynamic Angular standalone component designed to easily create, style, and manage interactive reports and export them as PDFs. It offers robust functionalities, including dynamic content management, custom styling, and comprehensive table manipulation.

## Live Demo

Check out a live demo on StackBlitz.

## Features

- **Dynamic Content**: Easily add, rearrange, and configure report elements dynamically.
- **Interactive Styling Panel**: Control fonts, colors, alignments, margins, padding, borders, and more.
- **Table Customization**: Full control over headers, data binding, formatting, and dynamic footer calculations (e.g., sum, average).
- **SQL Query Execution**: Directly execute SQL queries within the component to populate report tables dynamically.
- **PDF Export and Print**: Export reports as PDF files or print directly from the interface.

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
  [data]="yourData"
  [language]="'en'"
  [report]="yourReportModel"
  [editPath]="'/edit-path'"
  [isPreview]="false"
  [loading]="loadingStatus"
  (onSave)="saveReport($event)"
  (onNewReport)="createNewReport()"
  (onDelete)="deleteReport($event)"
  (onEndpointChange)="updateEndpoint($event)"
  (onExecute)="executeQuery($event)"
/>
```

## Inputs

| Input                   | Type           | Description                                      |
| ----------------------- | -------------- | ------------------------------------------------ |
| `data`                  | `any[]`        | Data array for binding and displaying in reports |
| `language`              | `'en' \| 'tr'` | Language selection (English or Turkish)          |
| `report`                | `ReportModel`  | Report configuration model                       |
| `editPath`              | `string`       | Path for editing reports                         |
| `isPreview`             | `boolean`      | Toggle between preview and edit modes            |
| `loading`               | `boolean`      | Indicates loading state for general content      |
| `sqlQueryLoadingSignal` | `boolean`      | Loading indicator for SQL query execution        |
| `tablesData`            | `any[]`        | Data used to populate SQL query tables           |

## Outputs

| Output             | Event Type          | Description                                |
| ------------------ | ------------------- | ------------------------------------------ |
| `onSave`           | `EventEmitter<any>` | Emits the report content when saved        |
| `onNewReport`      | `void`              | Initiates a new report creation process    |
| `onDelete`         | `any`               | Emits the ID of the report to be deleted   |
| `onEndpointChange` | `string`            | Emits new endpoint value when changed      |
| `onExecute`        | `string`            | Emits SQL query to execute on the database |

## Supported Elements

- Headings (`H1` - `H6`)
- Paragraphs (`P`)
- Images (`IMG`)
- Tables (`TABLE`)
- Horizontal Rules (`HR`)

## Page Configuration

- **Sizes**: A4, A5, A6
- **Orientation**: Portrait, Landscape
- **Fonts**: Customizable font families, sizes, and weights through Google Fonts

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT