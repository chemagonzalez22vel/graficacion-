export class Input {
    constructor(file) {
        this.index = 0;
        this.ok = true;
        this.eoFile = false;
        this.pbis = file;
    }
    readChar() {
        let ch;
        try {
            ch = this.pbis.charAt(this.index++);
            if (this.index > this.pbis.length) {
                this.eoFile = true;
                this.ok = false;
            }
        }
        catch (ioe) {
            this.ok = false;
        }
        return ch;
    }
    isWhiteSpace(ch) {
        return (ch == ' ');
    }
    isEmpty(ch) {
        return (ch.trim() == "");
    }
    isEnter(ch) {
        return (ch == '\n');
    }
    isREnter(ch) {
        return (ch == '\r');
    }
    isDigit(ch) {
        return (ch >= '0' && ch <= '9');
    }
    pushBack() {
        this.index--;
    }
    readInt() {
        let neg = false;
        let ch;
        do {
            ch = this.readChar();
        } while (this.isWhiteSpace(ch) || this.isEnter(ch) || this.isREnter(ch));
        if (ch === '-') {
            neg = true;
            ch = this.readChar();
        }
        if (!this.isDigit(ch)) {
            this.pushBack();
            this.ok = false;
            return 0;
        }
        let x = Number(ch);
        for (;;) {
            ch = this.readChar();
            if (!this.isDigit(ch)) {
                this.pushBack();
                break;
            }
            x = 10 * x + Number(ch);
        }
        return (neg ? -x : x);
    }
    readFloat() {
        let ch;
        let nDec = -1;
        let neg = false;
        do {
            ch = this.readChar();
        } while (this.isWhiteSpace(ch));
        if (ch == '-') {
            neg = true;
            ch = this.readChar();
        }
        if (ch == '.') {
            nDec = 1;
            ch = this.readChar();
        }
        if (!this.isDigit(ch)) {
            this.ok = false;
            this.pushBack();
            return 0;
        }
        let x = Number(ch);
        for (;;) {
            ch = this.readChar();
            if (this.isDigit(ch)) {
                x = 10 * x + Number(ch);
                if (nDec >= 0)
                    nDec++;
            }
            else if (ch == '.' && nDec == -1)
                nDec = 0;
            else
                break;
        }
        while (nDec > 0) {
            x *= 0.1;
            nDec--;
        }
        if (ch == 'e' || ch == 'E') {
            let exp = this.readInt();
            if (!this.fails()) {
                while (exp < 0) {
                    x *= 0.1;
                    exp++;
                }
                while (exp > 0) {
                    x *= 10;
                    exp--;
                }
            }
        }
        else
            this.pushBack();
        return (neg ? -x : x);
    }
    skipRest() {
        let ch;
        do {
            ch = this.readChar();
        } while (!(this.eof() || ch == '\n'));
    }
    fails() {
        return !this.ok;
    }
    eof() {
        return this.eoFile;
    }
    clear() {
        this.ok = true;
    }
    readString() {
        let str = " ";
        let ch;
        do {
            ch = this.readChar();
        } while (!(this.eof() || ch == '"'));
        // Initial quote
        for (;;) {
            ch = this.readChar();
            if (this.eof() || ch == '"') // Final quote (end of string)
                break;
            str += ch;
        }
        return str;
    }
}
