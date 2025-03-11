export interface ElementStyleModel {
    text: string;
    width: string;
    textAlign?: string;
    borderWidth?: string;
    borderColor?: string;
    borderStyle?: string;
  }

  export const initializeElementStyle: ElementStyleModel = {
    text: "",
    width: "100%",
    textAlign: "start"
  }