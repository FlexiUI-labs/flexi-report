export interface ElementStyleModel {
    text: string;
    width: string;
    height?: string;
    objectFit?: string;
    textAlign?: string;
    borderWidth?: string;
    borderColor?: string;
    borderStyle?: string;
    trBorderWidth?: string;
    trBorderColor?: string;
    trBorderStyle?: string;
    thBorderWidth?: string;
    thBorderColor?: string;
    thBorderStyle?: string;
    thWidth?:string;
    tdBorderWidth?: string;
    tdBorderColor?: string;
    tdBorderStyle?: string;
    tdWidth?:string;
    fontSize?: string;
    thFontSize?:string;
    tdFontSize?:string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    fontWeight?: string;
    textDecoration?: string;
    showFooter?: boolean;
    property?: string;
    calculation?: string;
  }

  export const initializeElementStyle: ElementStyleModel = {
    text: "",
    width: "100%",
    textAlign: "start",
    fontFamily: "Roboto"
  }