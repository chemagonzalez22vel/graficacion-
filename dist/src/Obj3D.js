// Obj3D.java: A 3D object and its 2D representation.
// Uses: Point2D (Section 1.5), Point3D (Section 3.9),
//       Polygon3D, Input (Section 5.5).
import { Point2D } from './point2D.js';
import { Point3D } from './point3D.js';
import { Input } from './Input.js';
import { Polygon3D } from './Polygon3D.js';
export class Obj3D {
    constructor() {
        this.theta = 0.30;
        this.phi = 1.3;
        this.sunZ = 1 / Math.sqrt(3);
        this.sunY = this.sunZ;
        this.sunX = -this.sunZ;
        this.inprodMin = 1e30;
        this.inprodMax = -1e30;
        this.w = new Array(); // World coordinates
        this.polyList = new Array(); // Polygon3D objects
        this.file = " "; // File name
    }
    read(file) {
        let inp = new Input(file);
        if (inp.fails())
            return this.failing();
        this.file = file;
        this.xMin = this.yMin = this.zMin = +1e30;
        this.xMax = this.yMax = this.zMax = -1e30;
        return this.readObject(inp); // Read from inp into obj
    }
    getPolyList() { return this.polyList; }
    getFName() { return this.file; }
    getE() { return this.e; }
    getVScr() { return this.vScr; }
    getImgCenter() { return this.imgCenter; }
    getRho() { return this.rho; }
    getD() { return this.d; }
    failing() {
        return false;
    }
    readObject(inp) {
        //debugger;
        for (;;) {
            let i = inp.readInt();
            if (inp.fails()) {
                inp.clear();
                break;
            }
            if (i < 0) {
                console.log("Negative vertex number in first part of input file");
                return this.failing();
            }
            // debugger
            //w.ensureCapacity(i + 1);
            let x = inp.readFloat();
            let y = inp.readFloat();
            let z = inp.readFloat();
            this.addVertex(i, x, y, z);
        }
        this.shiftToOrigin(); // Origin in center of object.
        let ch;
        let count = 0;
        //debugger;
        do { // Skip the line "Faces:"
            ch = inp.readChar();
            count++;
        } while (!inp.eof() && ch != '\n' && ch != '\r');
        if (count < 6 || count > 8) {
            console.log("Invalid input file");
            return this.failing();
        }
        //  Build polygon list:
        for (;;) {
            let vnrs = [];
            for (;;) {
                let i = inp.readInt();
                if (inp.fails()) {
                    inp.clear();
                    break;
                }
                let absi = Math.abs(i);
                if (i == 0 || absi >= this.w.length ||
                    this.w[absi] == null) {
                    console.log("Invalid vertex number: " + absi +
                        " must be defined, nonzero and less than " + this.w.length);
                    return this.failing();
                }
                vnrs.push(i);
            }
            ch = inp.readChar();
            if (ch != '.' && ch != '#')
                break;
            // Ignore input lines with only one vertex number:
            if (vnrs.length >= 2)
                this.polyList.push(new Polygon3D(vnrs));
        }
        //inp.close();
        //console.log(this.polyList)
        return true;
    }
    addVertex(i, x, y, z) {
        if (x < this.xMin)
            this.xMin = x;
        if (x > this.xMax)
            this.xMax = x;
        if (y < this.yMin)
            this.yMin = y;
        if (y > this.yMax)
            this.yMax = y;
        if (z < this.zMin)
            this.zMin = z;
        if (z > this.zMax)
            this.zMax = z;
        //if (i >= this.w.length) this.w.setSize(i + 1);
        //this.w.push(new Point3D(x, y, z));
        this.w[i] = new Point3D(x, y, z);
    }
    shiftToOrigin() {
        let xwC = 0.5 * (this.xMin + this.xMax);
        let ywC = 0.5 * (this.yMin + this.yMax);
        let zwC = 0.5 * (this.zMin + this.zMax);
        let n = this.w.length;
        for (let i = 1; i < n; i++) {
            if (this.w[i] != undefined) {
                this.w[i].x -= xwC;
                this.w[i].y -= ywC;
                this.w[i].z -= zwC;
            }
        }
        let dx = this.xMax - this.xMin, dy = this.yMax - this.yMin, dz = this.zMax - this.zMin;
        this.rhoMin = 0.6 * Math.sqrt(dx * dx + dy * dy + dz * dz);
        this.rhoMax = 1000 * this.rhoMin;
        this.rho = 3 * this.rhoMin;
    }
    initPersp() {
        let costh = Math.cos(this.theta);
        let sinth = Math.sin(this.theta);
        let cosph = Math.cos(this.phi);
        let sinph = Math.sin(this.phi);
        this.v11 = -sinth;
        this.v12 = -cosph * costh;
        this.v13 = sinph * costh;
        this.v21 = costh;
        this.v22 = -cosph * sinth;
        this.v23 = sinph * sinth;
        this.v32 = sinph;
        this.v33 = cosph;
        this.v43 = -this.rho;
    }
    eyeAndScreen(dim) {
        this.initPersp();
        let n = this.w.length;
        this.e = new Array(n);
        this.vScr = new Array(n);
        let xScrMin = 1e30, xScrMax = -1e30, yScrMin = 1e30, yScrMax = -1e30;
        for (let i = 1; i < n; i++) {
            let P = this.w[i];
            if (P == undefined) {
                this.e[i] = undefined;
                this.vScr[i] = null;
            }
            else {
                let x = this.v11 * P.x + this.v21 * P.y;
                let y = this.v12 * P.x + this.v22 * P.y + this.v32 * P.z;
                let z = this.v13 * P.x + this.v23 * P.y + this.v33 * P.z + this.v43;
                let Pe = this.e[i] = new Point3D(x, y, z);
                let xScr = -Pe.x / Pe.z, yScr = -Pe.y / Pe.z;
                this.vScr[i] = new Point2D(xScr, yScr);
                if (xScr < xScrMin)
                    xScrMin = xScr;
                if (xScr > xScrMax)
                    xScrMax = xScr;
                if (yScr < yScrMin)
                    yScrMin = yScr;
                if (yScr > yScrMax)
                    yScrMax = yScr;
            }
        }
        let rangeX = xScrMax - xScrMin, rangeY = yScrMax - yScrMin;
        this.d = 0.95 * Math.min(dim.width / rangeX, dim.height / rangeY);
        this.imgCenter = new Point2D(this.d * (xScrMin + xScrMax) / 2, this.d * (yScrMin + yScrMax) / 2);
        for (let i = 1; i < n; i++) {
            if (this.vScr[i] != null) {
                this.vScr[i].x *= this.d;
                this.vScr[i].y *= this.d;
            }
        }
        return this.d * Math.max(rangeX, rangeY);
        // Maximum screen-coordinate range used in CvHLines for HP-GL
    }
    planeCoeff() {
        let nFaces = this.polyList.length;
        for (let j = 0; j < nFaces; j++) {
            let pol = this.polyList[j];
            let nrs = pol.getNrs();
            if (nrs.length < 3)
                continue;
            let iA = Math.abs(nrs[0]), // Possibly negative
            iB = Math.abs(nrs[1]), // for HLines.
            iC = Math.abs(nrs[2]);
            let A = this.e[iA], B = this.e[iB], C = this.e[iC];
            let u1 = B.x - A.x, u2 = B.y - A.y, u3 = B.z - A.z, v1 = C.x - A.x, v2 = C.y - A.y, v3 = C.z - A.z, a = u2 * v3 - u3 * v2, b = u3 * v1 - u1 * v3, c = u1 * v2 - u2 * v1, len = Math.sqrt(a * a + b * b + c * c), h;
            a /= len;
            b /= len;
            c /= len;
            h = a * A.x + b * A.y + c * A.z;
            pol.setAbch(a, b, c, h);
            let A1 = this.vScr[iA], B1 = this.vScr[iB], C1 = this.vScr[iC];
            u1 = B1.x - A1.x;
            u2 = B1.y - A1.y;
            v1 = C1.x - A1.x;
            v2 = C1.y - A1.y;
            if (u1 * v2 - u2 * v1 <= 0)
                continue; // backface
            let inprod = a * this.sunX + b * this.sunY + c * this.sunZ;
            if (inprod < this.inprodMin)
                this.inprodMin = inprod;
            if (inprod > this.inprodMax)
                this.inprodMax = inprod;
        }
        this.inprodRange = this.inprodMax - this.inprodMin;
    }
    vp(cv, dTheta, dPhi, fRho) {
        this.theta += dTheta;
        this.phi += dPhi;
        let rhoNew = fRho * this.rho;
        if (rhoNew >= this.rhoMin && rhoNew <= this.rhoMax)
            this.rho = rhoNew;
        else
            return false;
        cv.paint();
        return true;
    }
    colorCode(a, b, c) {
        let inprod = a * this.sunX + b * this.sunY + c * this.sunZ;
        return Math.round(((inprod - this.inprodMin) / this.inprodRange) * 255);
    }
}
