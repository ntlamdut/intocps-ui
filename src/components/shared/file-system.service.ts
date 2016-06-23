import {Injectable} from "@angular/core";
import * as fs from "fs";

// This service wraps the Node.JS filesystem API in promises.

@Injectable()
export class FileSystemService {
    readFile(path:string):Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(path, "utf8", (error, data) => {
                if (error)
                    reject(error);
                else
                    resolve(data);
            });
        });
    }

    writeFile(path:string, content:string) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, content, "utf8", (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }

    mkdir(path:string) {
        return new Promise((resolve, reject) => {
            fs.mkdir(path, (error) => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
}