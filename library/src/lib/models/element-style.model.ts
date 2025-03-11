export interface ElementStyleModel {
    text: string;
    width: string;
    textAlign: string;
    border: string;
  }

  export const initializeElementStyle: ElementStyleModel = {
    text: "",
    width: "100%",
    textAlign: "start",
    border: "1px solid black"
  }