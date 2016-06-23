
///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />


import * as Collections from 'typescript-collections'
import * as Fmi from "../coe/fmi"
import {MultiModelConfig} from "./MultiModelConfig"
import {Parser, Serializer} from "./Parser"

import Path = require('path');
import fs = require('fs');


export class CoSimulationConfig implements ISerializable {

    //project root required to resolve multimodel path
    projectRoot: string;

    multiModel: MultiModelConfig;
    sourcePath: string;

    //optional livestream outputs
    livestream: Map<Fmi.Instance, Fmi.ScalarVariable[]> = new Map<Fmi.Instance, Fmi.ScalarVariable[]>();
    algorithm: ICoSimAlgorithm = new FixedStepAlgorithm();
    startTime: number = 0;
    endTime: number = 10;

    toObject(): any {
        return new Serializer().toObjectCoSimulationConfig(this, this.projectRoot);
    }

    save(): Promise<void> {
        let self = this;
        return new Promise<void>(function (resolve, reject) {
            try {
                fs.writeFile(self.sourcePath, JSON.stringify(self.toObject()), function (err) {
                    if (err !== null) {
                        return reject(err);
                    }
                    resolve();
                });
            } catch (e) {
                reject(e);
            }
        });
    }


    static create(path: string, projectRoot: string, fmuRootPath: string, jsonData: any): Promise<CoSimulationConfig> {
        return new Promise<CoSimulationConfig>(function (resolveFinal, reject) {
            let parser = new Parser();
            var mmPath: string = parser.parseMultiModelPath(jsonData, projectRoot);

            console.info("Parsing mm from cc with: " + mmPath);
            MultiModelConfig.parse(mmPath, fmuRootPath).then(mm => {
                let cc = new CoSimulationConfig();
                cc.projectRoot = projectRoot;
                cc.multiModel = mm;
                cc.sourcePath = path;
                cc.startTime = parser.parseStartTime(jsonData) || 0;
                cc.endTime = parser.parseEndTime(jsonData) || 10;
                cc.livestream = parser.parseLivestream(jsonData, mm);
                cc.algorithm = parser.parseAlgorithm(jsonData);

                resolveFinal(cc);
            }).catch(e => reject(e));
        });
    }

    static parse(path: string, rojectRoot: string, fmuRootPath: string): Promise<CoSimulationConfig> {
        let self = this;
        return new Promise<CoSimulationConfig>(function (resolveFinal, reject) {


            let checkFileExists = new Promise<Buffer>(function (resolve, reject) {
                try {
                    if (fs.accessSync(path, fs.R_OK)) {
                        reject();
                    }
                    resolve();
                } catch (e) {
                    reject(e);
                }
            }).then(() =>
                new Promise<Buffer>(function (resolve, reject) {
                    fs.readFile(path, function (err, data) {
                        if (err !== null) {
                            return reject(err);
                        }
                        resolve(data);
                    });
                })).then((content) => {

                    //console.log("Asynchronous read: " + content.toString());
                    var jsonData = JSON.parse(content.toString());
                    console.log(jsonData);

                    self.create(path, rojectRoot, fmuRootPath, jsonData).then(mm => { resolveFinal(mm); }).catch(e => reject(e));

                })
        });
    }
}

export interface ICoSimAlgorithm {
    name:string;
}

export class FixedStepAlgorithm implements ICoSimAlgorithm {
    name:string = "Fixed step";

    constructor(public size:number = 0.1) {

    }
}

export class VariableStepAlgorithm implements ICoSimAlgorithm {
    name:string = "Variable step";

    constructor(
        public initSize:number = 0.1,
        public sizeMin:number = 0.05,
        public sizeMax:number = 0.2,
        public constraints: VarStepConstraint[] = []
    ) {

    }
}

export enum VarStepConstraintType { ZeroCrossing, BoundedDifference, SamplingRate, FmuRequested }

export class VarStepConstraint {

    type: VarStepConstraintType;
    ports: Fmi.InstanceScalarPair[];
    order: number = 2;//can be 1 or 2
    abstol: number;
    safety: number;
}



