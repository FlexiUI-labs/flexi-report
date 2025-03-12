export interface ElementStyleModel {
    text: string;
    width: string;
    textAlign?: string;
    borderWidth?: string;
    borderColor?: string;
    borderStyle?: string;
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    fontWeight?: string;
    textDecoration?: string;
  }

  export const initializeElementStyle: ElementStyleModel = {
    text: "",
    width: "100%",
    textAlign: "start",
    fontFamily: "IBM Plex Sans"
  }