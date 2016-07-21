import {MultiModelConfig} from "./MultiModelConfig"
import {Parser, Serializer} from "./Parser"
import * as fs from "fs"
import {Instance, ScalarVariable, InstanceScalarPair} from "../angular2-app/coe/models/Fmu";
import {WarningMessage} from "./Messages";
import {FormArray, FormGroup, FormControl, Validators} from "@angular/forms";
import {
    numberValidator, integerValidator, lengthValidator,
    uniqueGroupPropertyValidator, uniqueValidator
} from "../angular2-app/shared/validators";

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
        let livestream:any = {};
        this.livestream.forEach((svs, instance) => livestream[Serializer.getId(instance)] = svs.map(sv => sv.name));

        let path = this.multiModel.sourcePath;
        if (path.indexOf(this.projectRoot) === 0)
            path = path.substring(this.projectRoot.length + 1);

        return {
            startTime: Number(this.startTime),
            endTime: Number(this.endTime),
            multimodel_path: path,
            livestream: livestream,
            algorithm: this.algorithm.toObject()
        };
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

    validate(): WarningMessage[] {
        // TODO
        console.error("No validation is done on the cosim config");

        return [];
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
                    config.algorithm = parser.parseAlgorithm(data, multiModel);

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
    toFormGroup(): FormGroup;
    toObject(): {[key:string]: any};
    type:string;
    name:string;
}

export class FixedStepAlgorithm implements ICoSimAlgorithm {
    type = "fixed-step";
    name = "Fixed Step";

    constructor(public size:number = 0.1) {

    }

    toFormGroup() {
        return new FormGroup({
            size: new FormControl(this.size, [Validators.required, numberValidator])
        });
    }

    toObject() {
        return {
            type: this.type,
            size: Number(this.size)
        };
    }
}

export class VariableStepAlgorithm implements ICoSimAlgorithm {
    type = "var-step";
    name = "Variable Step";

    constructor(
        public initSize:number = 0.1,
        public sizeMin:number = 0.05,
        public sizeMax:number = 0.2,
        public constraints: Array<VariableStepConstraint> = []
    ) {

    }

    toFormGroup() {
        return new FormGroup({
            initSize: new FormControl(this.initSize, [Validators.required, numberValidator]),
            sizeMin: new FormControl(this.sizeMin, [Validators.required, numberValidator]),
            sizeMax: new FormControl(this.sizeMax, [Validators.required, numberValidator]),
            constraints: new FormArray(this.constraints.map(c => c.toFormGroup()), uniqueGroupPropertyValidator("id"))
        });
    }

    toObject() {
        let constraints:any = {};
        this.constraints.forEach(c => constraints[c.id] = c.toObject());

        return {
            type: this.type,
            initsize: Number(this.initSize),
            size: [Number(this.sizeMin), Number(this.sizeMax)],
            constraints: constraints
        };
    }
}

export interface VariableStepConstraint {
    id:string;
    type:string;
    toFormGroup(): FormGroup;
    toObject(): {[key:string]: any};
}

export class ZeroCrossingConstraint implements VariableStepConstraint {
    type = "zerocrossing";

    constructor(
        public id:string = "zc",
        public ports:Array<InstanceScalarPair> = [],
        public order:string = "2", // Can be 1 or 2.
        public abstol?:number,
        public safety?:number
    ) {
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id),
            ports: new FormControl(this.ports, [lengthValidator(1, 2), uniqueValidator]),
            order: new FormControl(this.order),
            abstol: new FormControl(this.abstol, [numberValidator]),
            safety: new FormControl(this.safety, [numberValidator])
        });
    }

    toObject() {
        let obj:any = {
            type: this.type,
            ports: this.ports.map((port:InstanceScalarPair) => Serializer.getIdSv(port.instance, port.scalarVariable))
        };

        if (this.order) obj.order = Number(this.order);
        if (this.abstol) obj.abstol = Number(this.abstol);
        if (this.safety) obj.safety = Number(this.safety);

        return obj;
    }
}

export class BoundedDifferenceConstraint implements VariableStepConstraint {
    type = "boundeddifference";

    constructor(
        public id:string = "bd",
        public ports:Array<InstanceScalarPair> = [],
        public abstol?:number,
        public reltol?:number,
        public safety?:number,
        public skipDiscrete:boolean = true
    ) {
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id),
            ports: new FormControl(this.ports, [lengthValidator(1), uniqueValidator]),
            abstol: new FormControl(this.abstol, [numberValidator]),
            reltol: new FormControl(this.reltol, [numberValidator]),
            safety: new FormControl(this.safety, [numberValidator]),
            skipDiscrete: new FormControl(this.skipDiscrete)
        });
    }

    toObject() {
        let obj:any = {
            type: this.type,
            ports: this.ports.map((port:InstanceScalarPair) => Serializer.getIdSv(port.instance, port.scalarVariable)),
            skipDiscrete: !!this.skipDiscrete
        };

        if (this.abstol) obj.abstol = Number(this.abstol);
        if (this.reltol) obj.order = Number(this.reltol);
        if (this.safety) obj.safety = Number(this.safety);

        return obj;
    }
}

export class SamplingRateConstraint implements VariableStepConstraint {
    type = "samplingrate";

    constructor(
        public id:string = "sr",
        public base:number,
        public rate:number,
        public startTime:number
    ) {
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id, [Validators.required]),
            base: new FormControl(this.base, [Validators.required, integerValidator]),
            rate: new FormControl(this.rate, [Validators.required, integerValidator]),
            startTime: new FormControl(this.startTime, [Validators.required, integerValidator])
        });
    }

    toObject() {
        return {
            type: this.type,
            base: Number(this.base),
            rate: Number(this.rate),
            startTime: Number(this.startTime)
        }
    }
}

