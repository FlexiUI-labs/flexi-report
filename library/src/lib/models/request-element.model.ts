export interface RequestElementModel{
    index: number,
    label: string,
    type: string,
    name: string,
    endpoint?: string,
    data?: {id: any, name:any}[]
}

export const initilizeRequestElementModel: RequestElementModel = {
    index: 0,
    label: "",
    type: "",
    name: ""
}