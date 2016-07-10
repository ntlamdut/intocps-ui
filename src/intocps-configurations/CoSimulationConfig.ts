///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

import {MultiModelConfig} from "./MultiModelConfig"
import {Parser, Serializer} from "./Parser"
import * as fs from "fs"
import {Instance, ScalarVariable, InstanceScalarPair} from "../angular2-app/coe/models/Fmu";

export class CoSimulationConfig implements ISerializable {

    //project root required to resolve multimodel path
    projectRoot: string;

    multiModel: MultiModelConfig;
    sourcePath: string;

    //optional livestream outputs
    livestream: Map<Instance, ScalarVariable[]> = new Map<Instance, ScalarVariable[]>();
    algorithm: ICoSimAlgorithm = new FixedStepAlgorithm();
    startTime: number = 0;
    endTime: number = 10;

    toObject(): any {
        return new Serializer().toObjectCoSimulationConfig(this, this.projectRoot);
    }

    save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                fs.writeFile(this.sourcePath, JSON.stringify(this.toObject()), error => {
                    if (error)
                        reject(error);
                    else
                        resolve();
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    static create(path: string, projectRoot: string, fmuRootPath: string, data: any): Promise<CoSimulationConfig> {
        return new Promise<CoSimulationConfig>((resolve, reject) => {
            let parser:Parser = new Parser();
            let mmPath:string = parser.parseMultiModelPath(data, projectRoot);

            MultiModelConfig
                .parse(mmPath, fmuRootPath)
                .then(multiModel => {
                    let config = new CoSimulationConfig();

                    config.projectRoot = projectRoot;
                    config.multiModel = multiModel;
                    config.sourcePath = path;
                    config.startTime = parser.parseStartTime(data) || 0;
                    config.endTime = parser.parseEndTime(data) || 10;
                    config.livestream = parser.parseLivestream(data, multiModel);
                    config.algorithm = parser.parseAlgorithm(data);

                    resolve(config);
                })
                .catch(error => reject(error));
        });
    }

    static parse(path: string, projectRoot: string, fmuRootPath: string): Promise<CoSimulationConfig> {
        return new Promise<CoSimulationConfig>((resolve, reject) => {
            fs.access(path, fs.R_OK, error => {
                if (error) return reject(error);

                fs.readFile(path, (error, content) => {
                    if (error) return reject(error);

                    this.create(path, projectRoot, fmuRootPath, JSON.parse(content.toString()))
                        .then(multiModel => resolve(multiModel))
                        .catch(error => reject(error));
                });
            });
        });
    }
}

export interface ICoSimAlgorithm {
}

export class FixedStepAlgorithm implements ICoSimAlgorithm {
    constructor(public size:number = 0.1) {

    }
}

export class VariableStepAlgorithm implements ICoSimAlgorithm {
    constructor(
        public initSize:number = 0.1,
        public sizeMin:number = 0.05,
        public sizeMax:number = 0.2,
        public constraints: Array<VariableStepConstraint> = []
    ) {

    }
}

export interface VariableStepConstraint {
    id:string;
    type:string;
}

export class ZeroCrossingConstraint implements VariableStepConstraint {
    type:string = "zerocrossing";

    constructor(
        public id:string = "zc",
        public ports:Array<InstanceScalarPair> = [],
        public order:string = "2", // Can be 1 or 2.
        public abstol?:number,
        public safety?:number
    ) {
    }
}

export class BoundedDifferenceConstraint implements VariableStepConstraint {
    type:string = "boundeddifference";

    constructor(
        public id:string = "bd",
        public ports:Array<InstanceScalarPair> = [],
        public abstol?:number,
        public reltol?:number,
        public safety?:number,
        public skipDiscrete:boolean = true
    ) {
    }
}

export class SamplingRateConstraint implements VariableStepConstraint {
    type:string = "samplingrate";

    constructor(
        public id:string = "sr",
        public base:number,
        public rate:number,
        public startTime:number
    ) {
    }
}

