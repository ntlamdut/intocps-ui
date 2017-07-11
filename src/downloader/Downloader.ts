import * as childProcess from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import { Utilities } from "../utilities"
let request = require("request");

let progress = require("request-progress");
let fsProgress = require('progress-stream');
let hash = require("md5-promised");
let yauzl = require("yauzl");
let mkdirp = require("mkdirp");

var previousVersionsLocalPath = "";

function isUrlLocal(url: any): boolean {
    return url.startsWith("file:");
}


function requestProxy(options: any, callback?: any) {

    if ("uri" in options || "url" in options) {
        var urlPath = "";
        var isLocal = false;
        if (isUrlLocal(options["uri"] + "")) {
            isLocal = true;
            urlPath = options["uri"];
        } else if (isUrlLocal(options["url"] + "")) {
            isLocal = true;
            urlPath = options["url"];
        }

        if (isLocal) {
            //const { URL } = require('url');
            var readJson = "json" in options && options["json"];

            const URL = require('url').Url;
            let u = new URL().parse(urlPath);
            //readJson? JSON.parse(data+""):data
            fs.readFile(u.path, (err, data) => {
                callback(err, null, err == null && readJson ? JSON.parse(data + "") : data);
            });
            return;
        }
    }

    return request(options, callback);
}

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
        requestProxy({ url: url, json: true }, function (
            error: Error, response: http.IncomingMessage, body: any) {
            if (!error && (response == null || response.statusCode == 200)) {
                if (isUrlLocal(url)) {
                    previousVersionsLocalPath = url;
                }
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}


export function fetchVersion(url: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        requestProxy({ url: url, json: true }, function (
            error: Error, response: http.IncomingMessage, body: any) {
            if (!error && (response == null || response.statusCode == 200)) {
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

        var p = null;

        if (isUrlLocal(url)) {
            const URL = require('url').Url;
            var localUrl = url;
            if (!localUrl.startsWith("file:/")) {

                localUrl = path.join(path.dirname(previousVersionsLocalPath), new URL().parse(localUrl).path);
            }

            let localPath = new URL().parse(localUrl).path;
            var stat = fs.statSync(localPath);
            var str = fsProgress({
                length: stat.size,
                time: 100 /* ms */
            });

            str.on('progress', function (progress: any) {
                var p: any = {};
                p["percentage"] = progress.percentage / 100;
                progressCallback(p);

                if (progress.percentage >= 100) {
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
                }
                /*
                {
                    percentage: 9.05,
                    transferred: 949624,
                    length: 10485760,
                    remaining: 9536136,
                    eta: 42,
                    runtime: 3,
                    delta: 295396,
                    speed: 949624
                }
                */
            });

            p = fs.createReadStream(localPath)
                .pipe(str);


        } else {

            p = progress(request(url))
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
                });
        }
        p.pipe(fs.createWriteStream(filePath));
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


export function toolRequiresUnpack(tool: any) {
    let platFormToUse = tool.platforms.any ? "any" : SYSTEM_PLATFORM;
    const action: string = tool.platforms[platFormToUse].action;
    return action === "unpack";
}

export function unpackTool(filePath: string, targetDirectory: string) {
    return new Promise((resolve, reject) => {
        yauzl.open(filePath, { lazyEntries: true }, function (err: any, zipfile: any) {
            if (err) throw err;
            zipfile.readEntry();
            zipfile.on("entry", function (entry: any) {
                let desiredPath = path.join(targetDirectory, entry.fileName);
                //let desiredPath = targetDirectory + entry.fileName;
                if (/\/$/.test(entry.fileName)) {
                    // directory file names end with '/'
                    mkdirp(desiredPath, function (err: any) {
                        if (err) throw err;
                        zipfile.readEntry();
                    });
                } else {
                    // file entry
                    zipfile.openReadStream(entry, function (err: any, readStream: any) {
                        if (err) throw err;
                        // ensure parent directory exists
                        mkdirp(path.dirname(desiredPath), function (err: any) {
                            if (err) throw err;
                            readStream.pipe(fs.createWriteStream(desiredPath));
                            readStream.on("end", function () {
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
