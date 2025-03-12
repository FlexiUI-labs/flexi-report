import { computed, Injectable, signal } from '@angular/core';
import { initializePageSetting } from '../models/page-setting.model';

@Injectable({
  providedIn: 'root'
})
export class PageService {
  readonly pageSize = signal<"a4" | "a5" | "a6">("a4");
  readonly orientation = signal<"landscape" | "portrait">("portrait");
  readonly fontFamily = signal<string>("IBM Plex Sans");
  readonly pageSetting = computed(() => {
    if (this.orientation() === "portrait") {
      if (this.pageSize() === "a4") {
        return {
          width: "794px",
          height: "1123px",
        }
      } else if (this.pageSize() === "a5") {
        return {
          width: "559px",
          height: "794px"
        }
      }
      else if (this.pageSize() === "a6") {
        return {
          width: "397px",
          height: "559px"
        }
      }
    } else if (this.orientation() === "landscape") {
      if (this.pageSize() === "a4") {
        return {
          width: "1123px",
          height: "794px"
        }
      } else if (this.pageSize() === "a5") {
        return {
          width: "794px",
          height: "559px"
        }
      }
      else if (this.pageSize() === "a6") {
        return {
          width: "559px",
          height: "397px"
        }
      }
    }
    return initializePageSetting;
  })
}
