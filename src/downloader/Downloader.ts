import * as childProcess from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import {Utilities} from "../utilities"
let request = require("request");
let progress = require("request-progress");
let hash = require("md5-promised");
let yauzl = require("yauzl");
let mkdirp = require("mkdirp");

export function getSystemPlatform() {
    let arch: string = Utilities.getSystemArchitecture();
    if (!(arch === "32" || arch === "64"))
        throw new Error(`Unsupported architecture ${arch}`);

    let platform: string = Utilities.getSystemPlatform();
    if (platform == "linux" || platform == "windows" || platform == "darwin") {
        if (platform == "darwin")
            platform = "osx"
    }
    else
        throw new Error(`Unsupport platform ${platform}`);

    return platform + arch;
}


export const SYSTEM_PLATFORM = getSystemPlatform();


export function fetchVersionList(url: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        // let data = new Stream<string>();
        request({ url: url, json: true }, function (
            error: Error, response: http.IncomingMessage, body: any) {
            if (!error && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}


export function fetchVersion(url: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        request({ url: url, json: true }, function (
            error: Error, response: http.IncomingMessage, body: any) {
            if (!error && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}


export function downloadTool(tool: any, targetDirectory: string, progressCallback: Function) {
    let platFormToUse = tool.platforms.any ? "any" : SYSTEM_PLATFORM;
    const url: string = tool.platforms[platFormToUse].url;
    const fileName: string = tool.platforms[platFormToUse].filename;
    const filePath: string = path.join(targetDirectory, fileName);
    const md5sum: string = tool.platforms[platFormToUse].md5sum;
    return new Promise<any>((resolve, reject) => {
        progress(request(url))
            .on("progress", function (state: any) {
                progressCallback(state);
            })
            .on("error", function (error: Error) {
                reject(error);
            })
            .on("end", function () {
                progressCallback(1);
                hash(filePath).then(function (newMd5sum: string) {
                    if (newMd5sum == md5sum) {
                        resolve(filePath);
                    } else {
                        reject("Bad MD5 expected: '" + md5sum + "' got: '" + newMd5sum + "'");
                    }
                }, function (error: string) {
                    reject(error);
                });
            })
            .pipe(fs.createWriteStream(filePath));
    });
}


function launchToolInstaller(filePath: string) {
    return new Promise<string>((resolve, reject) => {
        childProcess.execFile(filePath, function (error: string, stdout: string, stderr: string) {
            if (!error) {
                resolve(stdout);
            } else {
                reject(error)
            }
        });
    });
}


export function toolRequiresUnpack(tool: any){
    let platFormToUse = tool.platforms.any ? "any" : SYSTEM_PLATFORM;
    const action: string = tool.platforms[platFormToUse].action;
    return action === "unpack";
}

export function unpackTool(filePath: string, targetDirectory: string) {
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, {lazyEntries: true}, function(err  : any, zipfile : any) {
        if (err) throw err;
        zipfile.readEntry();
        zipfile.on("entry", function(entry : any) {
            let desiredPath = path.join(targetDirectory, entry.fileName);
            //let desiredPath = targetDirectory + entry.fileName;
            if (/\/$/.test(entry.fileName)) {
            // directory file names end with '/'
            mkdirp(desiredPath, function(err : any) {
                if (err) throw err;
                zipfile.readEntry();
            });
            } else {
            // file entry
            zipfile.openReadStream(entry, function(err : any, readStream : any) {
                if (err) throw err;
                // ensure parent directory exists
                mkdirp(path.dirname(desiredPath), function(err : any) {
                if (err) throw err;
                readStream.pipe(fs.createWriteStream(desiredPath));
                readStream.on("end", function() {
                    zipfile.readEntry();
                    resolve();
                });
                });
            });
            }
        });
        });
    });
}


export function compareVersions(a: string, b: string) {
    var i: number, diff: number;
    var regExStrip0 = /(\.0+)+$/;
    var segmentsA = a.replace(regExStrip0, '').split('.');
    var segmentsB = b.replace(regExStrip0, '').split('.');
    var l = Math.min(segmentsA.length, segmentsB.length);

    for (i = 0; i < l; i++) {
        diff = parseInt(segmentsA[i], 10) - parseInt(segmentsB[i], 10);
        if (diff) {
            return diff;
        }
    }
    return segmentsA.length - segmentsB.length;
}
