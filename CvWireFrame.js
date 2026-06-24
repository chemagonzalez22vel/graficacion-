import { Dimension } from './Dimension.js';
export class CvWireframe {
    constructor(g, canvas) {
        this.g = g;
        this.canvas = canvas;
    }
    getObj() { return this.obj; }
    setObj(obj) { this.obj = obj; }
    iX(x) { return Math.round(this.centerX + x - this.imgCenter.x); }
    iY(y) { return Math.round(this.centerY - y + this.imgCenter.y); }
    paint(clearFirst = true) {
        if (this.obj == undefined)
            return;
        let polyList = this.obj.getPolyList();
        if (polyList == undefined)
            return;
        let nFaces = polyList.length;
        if (nFaces == 0)
            return;
        let dim = new Dimension(this.canvas.width, this.canvas.height);
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
        let vScr = this.obj.getVScr();
        let e = this.obj.getE();
        if (e == undefined || vScr == undefined)
            return;
        this.g.strokeStyle = "#000000";
        this.g.lineWidth = 1;
        for (let j = 0; j < nFaces; j++) {
            let pol = polyList[j];
            let nrs = pol.getNrs();
            if (nrs.length < 3)
                continue;
            for (let iA = 0; iA < nrs.length; iA++) {
                let iB = (iA + 1) % nrs.length;
                let na = Math.abs(nrs[iA]), nb = Math.abs(nrs[iB]);
                let a = vScr[na], b = vScr[nb];
                if (a != undefined && b != undefined) {
                    this.drawLine(this.g, this.iX(a.x), this.iY(a.y), this.iX(b.x), this.iY(b.y));
                }
            }
        }
    }
    drawLine(g, x1, y1, x2, y2) {
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.closePath();
        g.stroke();
    }
}
