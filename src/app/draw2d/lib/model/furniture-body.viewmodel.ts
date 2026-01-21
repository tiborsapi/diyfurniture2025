import { Draw2DSupportService } from '../draw/draw2-dsupport.service';
import {
  FurnitureBody,
  HorizontalSplit,
  VerticalSplit,
  FurnitureElement,
  Rectangle,
} from './furniture-body.model';

export class ViewFurnitureElement {
  public constructor(protected model: FurnitureElement | null = null) {
    if (this.model == null || this.model.split == null) {
      return;
    }
    if ('relativePositionY' in this.model.split) {
      this.split = new ViewHorizontalSplit(this.model.split as HorizontalSplit);
    }
    if ('relativePositionX' in this.model.split) {
      this.split = new ViewVerticalSplit(this.model.split as VerticalSplit);
    }
  }

  protected split: ViewSplit | null = null;
  
  public draw(x: number, y: number, draw: Draw2DSupportService): void {
    if (this.model != null) {
      draw.drawRectangle(convertToRectangle(x, y, this.model));
      
      if (this.split != null) {
        this.split.draw(x + this.model.posX, y + this.model.posY, draw);
      }
    }
  }
}

function convertToRectangle(x:number,y:number,element:FurnitureElement): Rectangle {
  // For FurnitureBody elements, use the provided coordinates directly
  // For split elements, the x,y parameters should already be absolute coordinates
  return {
    posX: x + element.posX,
    posY: y + element.posY,
    width: element.width,
    height: element.height,
    material: element.material
  } as any;
}
export class ViewFurnitureBody extends ViewFurnitureElement {
  public draw(x: number, y: number, draw: Draw2DSupportService): void {
    const body = (<FurnitureBody>this.model);
    super.draw(body.x, body.y,draw);
  }
}

export abstract class ViewSplit extends ViewFurnitureElement {}

export class ViewHorizontalSplit extends ViewSplit {
  private topElement: ViewFurnitureElement;
  private bottomElement: ViewFurnitureElement;

  public constructor(private splitModel: HorizontalSplit) {
    super();
    this.topElement = new ViewFurnitureElement(this.splitModel.topElement);
    this.bottomElement = new ViewFurnitureElement(this.splitModel.bottomElement);
  }

  public draw(x: number, y: number, draw: Draw2DSupportService): void {
    this.topElement.draw(x,y,draw);
    this.bottomElement.draw(x,y,draw);
  }
}

export class ViewVerticalSplit extends ViewSplit {
  private leftElement: ViewFurnitureElement;
  private rightElement: ViewFurnitureElement;

  public constructor(private splitModel: VerticalSplit) {
    super();
    this.leftElement = new ViewFurnitureElement(this.splitModel.leftElement);
    this.rightElement = new ViewFurnitureElement(this.splitModel.rightElement);
  }
  public draw(x: number, y: number, draw: Draw2DSupportService): void {
    this.leftElement.draw(x,y,draw);
    this.rightElement.draw(x,y,draw);
  }
}
