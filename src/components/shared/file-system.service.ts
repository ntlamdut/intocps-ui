import {Injectable, NgZone} from "@angular/core";
import * as fs from "fs";
import {PromiseCompleter} from "@angular/core/src/facade/promise";

// This service wraps the Node.JS filesystem API.

@Injectable()
export class FileSystemService {
    constructor(private zone:NgZone) {

    }

    // Wrap the filesystem API in a promise and the Angular zone
    private wrap(fn:(resolve:Function, reject:Function) => void) {
        return new Promise((resolve, reject) => {
            this.zone.run(() => fn(resolve, reject));
        });
    }

    readFile(path:string):Promise<string> {
        return this.wrap((reject, resolve) => {
            fs.readFile(path, "utf8", (error, data) => {
                if (error)
                    reject(error);
                else
                    resolve(data);
            });
        });
    }

    writeFile(path:string, content:string) {
        return this.wrap((resolve, reject) => {
            fs.writeFile(path, content, "utf8", (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }

    copyFile(source:string, target:string) {
        return this.wrap((resolve, reject) => {
            let read = fs.createReadStream(source);
            read.on("error", error => reject(error));

            let write = fs.createWriteStream(target);
            write.on("error", error => reject(error));
            write.on("close", () => resolve());

            read.pipe(write);
        });
    }

    mkdir(path:string) {
        return this.wrap((resolve, reject) => {
            fs.mkdir(path, (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
}