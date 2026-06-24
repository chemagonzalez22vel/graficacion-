export class Dimension {
    constructor(w, h) {
        this._width = w;
        this._height = h;
    }
    get width() {
        return this._width;
    }
    get height() {
        return this._height;
    }
}
