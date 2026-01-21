export enum MyMouseEventType{
    START,
    MOVE,
    END
}
export interface DiyFurnitureMouseEvent {
    type: MyMouseEventType;
    x1: number;
    y1:number;
    x2:number;
    y2:number;
    shiftKey?: boolean;

}
