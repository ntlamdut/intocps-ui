import * as fs from 'fs';
import {CoeServerStatusUiController} from "./CoeServerStatusUiController"

interface ReadDataObject {
    readSize?: number
}

export class CoeLogPrinter {
    private maxFileReadSize: number;
    private remainingMaxFileReadSize: number;
    private callback: (data: string, skip: boolean) => void;
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

    private setMaxFileReadSize(maxFileReadSize: number) {
        this.maxFileReadSize = maxFileReadSize;
        this.remainingMaxFileReadSize = 5 * maxFileReadSize;
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
        // 200 is the typical number of characters per line.
        let truncateSizeInBytes = CoeServerStatusUiController.maxLines * 200;
        
        this.printingRemainingIsActive = true;
        // console.log(`Printing the remaining data from the COE log file with interval ${this.interval} ms.`)
        // Check if there is still remaining data to be printed, and print it.
        this.intervalHandle = setInterval(() => {
            let alteredFilePosition = false;
            let currentFileSize = this.getFileSize(this.path);
            if (currentFileSize != this.filePosition) {
                if(currentFileSize-truncateSizeInBytes > this.filePosition)
                {
                    // Advance the file position
                    this.filePosition = currentFileSize-truncateSizeInBytes;
                    alteredFilePosition = true;
                    //console.log(`CoeLogPrinter watching file: ${this.path} advanced file position to: ${this.filePosition}`);
                }
                let readSize = this.readFunction(this.path, currentFileSize, this.remainingMaxFileReadSize, alteredFilePosition, this.callback)
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

    private readFunction(path: string, currentSize: number, maxReadSize: number, alteredFilePosition: boolean, callback: (data: string, skip:boolean) => void): number | undefined {
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
            console.log(`Info: CoeLogPrinter watching ${path} encountered a non-positive read size. Current size: ${currentSize} - Read size: ${readSize} - File position: ${this.filePosition}. 
            This is probably due to a log file rollover. Reinitializing and trying again.`);
            
            currentSize = this.getFileSize(path);
            this.filePosition = 0;
            readSize = calcReadSize(currentSize);
            console.log(`Info: CoeLogPrinter watching ${path} reinitialized. Current size: ${currentSize} - Read size: ${readSize} - File position: ${this.filePosition}`);
        }

        if (readSize <= 0) {
            return;
        }
        else {
            let buffer = new Buffer(readSize);
            let fd = fs.openSync(path, 'r');            
            fs.readSync(fd, buffer, 0, readSize, this.filePosition);
            fs.closeSync(fd);
            callback(buffer.toString(),alteredFilePosition);
            // console.log(`CoeLogPrinter watching ${path} is reading from filePosition: ${this.filePosition} with the size fileReadSize: ${readSize}. Remaning to read: ${currentSize-this.filePosition-readSize}`);
            this.filePosition = this.filePosition + readSize

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
                this.readFunction(this.path, current.size, this.maxFileReadSize, false, this.callback);

        });
    }
}