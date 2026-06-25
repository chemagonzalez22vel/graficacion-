import { Obj3D } from './Obj3D.js';
import { Point2D } from './point2D.js';
import { Dimension } from './Dimension.js';
import { Polygon3D } from './Polygon3D.js';
import { Point3D } from './point3D.js';

export class CvWireframe{
  private maxX: number;
  private maxY: number;
  private centerX: number;
  private centerY: number;
  private obj: Obj3D;
  private imgCenter: Point2D;
  private g: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(g: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    this.g = g;
    this.canvas = canvas;
  }

  getObj(): Obj3D {return this.obj;}
  setObj(obj: Obj3D ):void {this.obj = obj;}
  iX(x: number): number{return Math.round(this.centerX + x - this.imgCenter.x);}
  iY(y: number): number{ return Math.round(this.centerY - y + this.imgCenter.y); }

  paint(clearFirst:boolean = true): void{
    if (this.obj == undefined) return;

    let polyList:Array<Polygon3D> = this.obj.getPolyList();
    if (polyList == undefined) return;

    let nFaces = polyList.length;

    if (nFaces == 0) return;

    let dim: Dimension = new Dimension(this.canvas.width, this.canvas.height);

    if (clearFirst) {
      this.canvas.width = this.canvas.width;
      this.g.fillStyle = "#FFFFFF";
      this.g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.maxX = dim.width - 1;
    this.maxY = dim.height - 1;
    this.centerX = this.maxX / 2;
    this.centerY = this.maxY / 2;

    this.obj.eyeAndScreen(dim);
    this.imgCenter = this.obj.getImgCenter();
    this.obj.planeCoeff();

    let vScr: Point2D[]  = this.obj.getVScr();
    let e: Point3D[] = this.obj.getE();
    if (e == undefined || vScr == undefined) return;

    this.g.strokeStyle = "#000000";
    this.g.lineWidth = 1;

    for (let j = 0; j < nFaces; j++){
      let pol: Polygon3D = polyList[j];
      let nrs: number[] = pol.getNrs();
      if (nrs.length < 3) continue;

      for (let iA = 0; iA < nrs.length; iA++) {
        let iB = (iA + 1) % nrs.length;
        let na = Math.abs(nrs[iA]), nb = Math.abs(nrs[iB]);
        let a: Point2D = vScr[na], b = vScr[nb];

        if (a != undefined && b != undefined) {
          this.drawLine(this.g, this.iX(a.x), this.iY(a.y), this.iX(b.x), this.iY(b.y));
        }
      }
    }
  }

  drawLine(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void{
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.closePath();
    g.stroke();
  }
}
