import {Injectable, NgZone} from "@angular/core";
import * as fs from "fs";

// This service wraps the Node.JS filesystem API.

@Injectable()
export class FileSystemService {
    constructor(private zone:NgZone) {

    }

    // Wrap the filesystem API in a promise and the Angular zone
    private wrap(fn:Function) {
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