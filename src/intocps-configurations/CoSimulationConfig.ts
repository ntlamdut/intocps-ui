///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

import * as Fmi from "../coe/fmi"
import {MultiModelConfig} from "./MultiModelConfig"
import {Parser, Serializer} from "./Parser"
import * as fs from "fs"

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
    constructor(
        public type: VarStepConstraintType,
        public ports: Fmi.InstanceScalarPair[],
        order?: number = 2,//can be 1 or 2
        abstol?: number,
        safety?: number
    ) {

    }
}
