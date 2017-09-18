import { MultiModelConfig } from "./MultiModelConfig"
import { Parser, Serializer } from "./Parser"
import * as fs from "fs"
import { Instance, ScalarVariable, InstanceScalarPair } from "../angular2-app/coe/models/Fmu";
import { WarningMessage, ErrorMessage } from "./Messages";
import { FormArray, FormGroup, FormControl, Validators } from "@angular/forms";
import {
    numberValidator, integerValidator, lengthValidator,
    uniqueGroupPropertyValidator, uniqueValidator
} from "../angular2-app/shared/validators";

import * as Path from 'path';

import { checksum } from "../proj/Project";

export class CoSimulationConfig implements ISerializable {
    //project root required to resolve multimodel path
    projectRoot: string;

    multiModel: MultiModelConfig;
    sourcePath: string;
    multiModelCrc: string;

    //optional livestream outputs
    livestream: Map<Instance, ScalarVariable[]> = new Map<Instance, ScalarVariable[]>();
    logVariables: Map<Instance, ScalarVariable[]> = new Map<Instance, ScalarVariable[]>();
    livestreamInterval: number = 0.0
    algorithm: ICoSimAlgorithm = new FixedStepAlgorithm();
    startTime: number = 0;
    endTime: number = 10;
    visible: boolean = false;
    loggingOn: boolean = false;
    enableAllLogCategoriesPerInstance: boolean = false;
    overrideLogLevel: string = null;
    postProcessingScript: string = "";
    parallelSimulation: boolean = false;
    stabalization: boolean = false;
    global_absolute_tolerance: number = 0.0;
    global_relative_tolerance: number = 0.0;
    simulationProgramDelay: boolean = false;

    public getProjectRelativePath(path: string): string {
        if(path==".")
            return "";
        if (path.length>0 && path.indexOf(this.projectRoot) === 0)
            return path.substring(this.projectRoot.length + 1);
        return path;
    }

    toObject(): any {
        let livestream: any = {};
        this.livestream.forEach((svs, instance) => livestream[Serializer.getId(instance)] = svs.map(sv => sv.name));
        let logVariables: any = {};
        this.logVariables.forEach((svs, instance) => logVariables[Serializer.getId(instance)] = svs.map(sv => sv.name));

        return {
            startTime: Number(this.startTime),
            endTime: Number(this.endTime),
            multimodel_path: this.getProjectRelativePath(this.multiModel.sourcePath),
            livestream: livestream,
            livestreamInterval: Number(this.livestreamInterval),
            logVariables: logVariables,
            visible: this.visible,
            loggingOn: this.loggingOn,
            overrideLogLevel: this.overrideLogLevel,
            enableAllLogCategoriesPerInstance: this.enableAllLogCategoriesPerInstance,
            algorithm: this.algorithm.toObject(),
            postProcessingScript: this.postProcessingScript,
            multimodel_crc: this.multiModelCrc,
            parallelSimulation: this.parallelSimulation,
            stabalizationEnabled: this.stabalization,
            global_absolute_tolerance: Number(this.global_absolute_tolerance),
            global_relative_tolerance: Number(this.global_relative_tolerance),
            simulationProgramDelay:this.simulationProgramDelay
        };
    }

    saveOverride(): Promise<void> {
        //we consider this an explicit user action. Allowing CRC override
        this.multiModelCrc = checksum(fs.readFileSync(this.multiModel.sourcePath).toString(), "md5", "hex");
        return this.save();
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

        //first re-check mm
        let mmWarnings = this.multiModel.validate();
        if (mmWarnings.length > 0) {
            return mmWarnings;
        }

        let messages: WarningMessage[] = [];
        // check this config
        if (this.endTime <= 0) {
            messages.push(new ErrorMessage("End time must be larger than 0. Actual: '" + this.endTime + "'"));
        }
        if (this.startTime >= this.endTime) {
            messages.push(new ErrorMessage("Start time '" + this.startTime + "'must be smaller than end time '" + this.endTime + "'"));
        }

        let multiModelCrcMatch = this.multiModelCrc == undefined || this.multiModelCrc === checksum(fs.readFileSync(this.multiModel.sourcePath).toString(), "md5", "hex");
        if (!multiModelCrcMatch) {
            return [new ErrorMessage("Multimodel crc check failed. Multimodel has changed.")];
        }

        return messages;
    }

    static create(path: string, projectRoot: string, fmuRootPath: string, data: any): Promise<CoSimulationConfig> {
        return new Promise<CoSimulationConfig>((resolve, reject) => {
            let parser: Parser = new Parser();
            var mmPath: string = Path.join(path, "..", "..", "mm.json");
            if (!fs.existsSync(mmPath)) {
                console.warn("Could not find mm at: " + mmPath + " initiating search or possible alternatives...")
                //no we have the old style
                fs.readdirSync(Path.join(path, "..", "..")).forEach(file => {
                    if (file.endsWith("mm.json")) {
                        mmPath = Path.join(path, "..", "..", file);
                        console.debug("Found old style mm at: " + mmPath);
                        return;
                    }
                });

            }

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
                    config.logVariables = parser.parseLogVariables(data, multiModel);
                    config.livestreamInterval = parseFloat(parser.parseSimpleTagDefault(data, "livestreamInterval", "0.0"));
                    config.algorithm = parser.parseAlgorithm(data, multiModel);
                    config.visible = parser.parseSimpleTagDefault(data, "visible", false);
                    config.loggingOn = parser.parseSimpleTagDefault(data, "loggingOn", false);
                    config.overrideLogLevel = parser.parseSimpleTagDefault(data, "overrideLogLevel", null);
                    config.enableAllLogCategoriesPerInstance = parser.parseSimpleTagDefault(data, "enableAllLogCategoriesPerInstance", false);
                    config.multiModelCrc = parser.parseMultiModelCrc(data);
                    config.postProcessingScript = parser.parseSimpleTagDefault(data, "postProcessingScript", "");

                    config.simulationProgramDelay = parser.parseSimpleTagDefault(data, "simulationProgramDelay", false);
                    config.parallelSimulation = parser.parseSimpleTagDefault(data, "parallelSimulation", false);
                    config.stabalization = parser.parseSimpleTagDefault(data, "stabalizationEnabled", false);
                    config.global_absolute_tolerance = parseFloat(parser.parseSimpleTagDefault(data, "global_absolute_tolerance", 0.0));
                    config.global_relative_tolerance = parseFloat(parser.parseSimpleTagDefault(data, "global_relative_tolerance", 0.01));


                    resolve(config);
                })
                .catch(error => reject(error));
        });
    }

    static parse(path: string, projectRoot: string, fmuRootPath: string): Promise<CoSimulationConfig> {
        return new Promise<CoSimulationConfig>((resolve, reject) => {
            fs.access(path, fs.constants.R_OK, error => {
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
    toObject(): { [key: string]: any };
    type: string;
    name: string;
}

export class FixedStepAlgorithm implements ICoSimAlgorithm {
    type = "fixed-step";
    name = "Fixed Step";

    constructor(public size: number = 0.1) {

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
        public initSize: number = 0.1,
        public sizeMin: number = 0.05,
        public sizeMax: number = 0.2,
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
        let constraints: any = {};
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
    id: string;
    type: string;
    toFormGroup(): FormGroup;
    toObject(): { [key: string]: any };
}

export class ZeroCrossingConstraint implements VariableStepConstraint {
    type = "zerocrossing";
    public name: string
    constructor(
        public id: string = "zc",
        public ports: Array<InstanceScalarPair> = [],
        public order: string = "2", // Can be 1 or 2.
        public abstol?: number,
        public safety?: number
    ) { }

    createName(index:number){
        this.name = "order"+index;
    }

    toFormGroup() {
        return new FormGroup({
            id: new FormControl(this.id),
            ports: new FormControl(this.ports, [lengthValidator(1, 2), uniqueValidator]),
            [this.name]: new FormControl(this.order),
            abstol: new FormControl(this.abstol, [numberValidator]),
            safety: new FormControl(this.safety, [numberValidator])
        });
    }

    toObject() {
        let obj: any = {
            type: this.type,
            ports: this.ports.map((port: InstanceScalarPair) => Serializer.getIdSv(port.instance, port.scalarVariable))
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
        public id: string = "bd",
        public ports: Array<InstanceScalarPair> = [],
        public abstol?: number,
        public reltol?: number,
        public safety?: number,
        public skipDiscrete: boolean = true
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
        let obj: any = {
            type: this.type,
            ports: this.ports.map((port: InstanceScalarPair) => Serializer.getIdSv(port.instance, port.scalarVariable)),
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
        public id: string = "sr",
        public base: number,
        public rate: number,
        public startTime: number
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

