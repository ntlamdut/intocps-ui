import fs = require('fs');

interface ReadDataObject {
    readSize?: number
}

export class CoeLogPrinter {
    private maxFileReadSize: number = 5000;
    private remainingMaxFileReadSize: number = 500000;
    private callback: (data: string) => void;
    private path: string;
    private pathIsSet: boolean = false;
    private interval: number = 1000;
    private filePosition: number = 0;
    private intervalIsRunning : boolean = false;
    private intervalHandle : number;
    private printingRemainingIsActive: boolean = false;

    constructor(maxFileReadSize: number, callback: (data: string) => void) {
        this.setMaxFileReadSize(maxFileReadSize);
        this.callback = callback;
    }

    public setInterval(interval: number) {
        this.interval = interval;
    }

    public setMaxFileReadSize(maxFileReadSize: number) {
        this.maxFileReadSize = maxFileReadSize;
    }

    private getFileSize(path: string) {
        return fs.statSync(path).size;
    }

    public stopPrintingRemaining()
    {
        if(this.intervalHandle)
        {
            clearInterval(this.intervalHandle);
            this.printingRemainingIsActive = false;
        }
    }

    public printRemaining(){
        this.printingRemainingIsActive = true;
        //console.log(`Printing the remaining data from the COE log file with interval ${this.interval} ms.`)
        // Check if there is still remaining data to be printed, and print it.
        this.intervalHandle = setInterval(() => {
            let currentFileSize = this.getFileSize(this.path);
            if (currentFileSize != this.filePosition) {
                let readSize = this.readFunction(this.path, currentFileSize, this.remainingMaxFileReadSize, this.callback)
                if (readSize && readSize < this.maxFileReadSize) {
                    this.stopPrintingRemaining();
                }
            }
            else {
                clearInterval(this.intervalHandle)
                this.stopPrintingRemaining();
            }
        }, this.interval);
    }

    public stopWatching() {
        if (this.pathIsSet) {
            fs.unwatchFile(this.path);
        }
    }

    private readFunction(path: string, currentSize: number, maxReadSize: number, callback: (data: string) => void): number | undefined {
        let calcReadSize = (currentSize: number) => {
            let readSize = currentSize - this.filePosition;
            if (readSize > maxReadSize) {
                return maxReadSize;
            }
            else {
                return readSize;
            }
        }

        let readSize: number = calcReadSize(currentSize)

        // This happens if the log has been truncated. Therefore perform a reinitialization and calculate the read size again.
        if (readSize <= 0) {
            //console.log(`CoeLogPrinter watching ${path} encountered a non-positive size to read: ${readSize}. Reinitializing and trying again.`)
            this.filePosition = this.getFileSize(path);
            readSize = calcReadSize(currentSize);
        }

        if (readSize <= 0) {
            console.error(`ERROR: CoeLogPrinter watching ${path} encountered an error with the value of fileReadSize: ${readSize}`);
            return;
        }
        else {
            let buffer = new Buffer(readSize);
            let fd = fs.openSync(path, 'r');

            
            fs.readSync(fd, buffer, 0, readSize, this.filePosition);
            fs.closeSync(fd);
            callback(buffer.toString());
            this.filePosition = this.filePosition + readSize
            console.log(`CoeLogPrinter fileReadSize: ${readSize} - filePosition: ${this.filePosition}. Remaning to read: ${currentSize-this.filePosition}`);
            return readSize;
        }
    }

    public startWatching(path: string) {
        if (this.pathIsSet) {
            console.error(`Instance of coeLogPrinter is already watching ${this.path} and can therefore not watch ${path}`);
            return;
        }
        this.path = path;
        this.pathIsSet = true;
        this.filePosition = this.getFileSize(path);

        fs.watchFile(this.path, { interval: this.interval }, (current: fs.Stats, previous: fs.Stats) => {
            if(!this.printingRemainingIsActive)
                this.readFunction(this.path, current.size, this.maxFileReadSize, this.callback);

        });
    }
}