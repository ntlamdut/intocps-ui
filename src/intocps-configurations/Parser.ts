///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>
///<reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
///<reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

import {MultiModelConfig} from "./MultiModelConfig";
import {
    CoSimulationConfig, ICoSimAlgorithm, FixedStepAlgorithm, VariableStepAlgorithm, VariableStepConstraint,
    ZeroCrossingConstraint, BoundedDifferenceConstraint, SamplingRateConstraint
} from "./CoSimulationConfig";
import * as Path from 'path';
import * as fs from 'fs';
import {Fmu, InstanceScalarPair, Instance, ScalarVariable} from "../angular2-app/coe/models/Fmu";

export class Parser {

    protected FMUS_TAG: string = "fmus";
    protected CONNECTIONS_TAG: string = "connections";
    protected PARAMETERS_TAG: string = "parameters";
    protected LIVESTREAM_TAG: string = "livestream";
    protected START_TIME_TAG: string = "startTime";
    protected END_TIME_TAG: string = "endTime";
    protected ALGORITHM_TAG: string = "algorithm";
    protected MULTIMODEL_PATH_TAG: string = "multimodel_path";

    protected ALGORITHM_TYPE: string = "type";
    protected ALGORITHM_TYPE_FIXED: string = "fixed-step";
    protected ALGORITHM_TYPE_VAR: string = "var-step";

    protected ALGORITHM_TYPE_FIXED_SIZE_TAG: string = "size";

    protected ALGORITHM_TYPE_VAR_INIT_SIZE_TAG: string = "initsize";
    protected ALGORITHM_TYPE_VAR_SIZE_TAG: string = "size";
    protected ALGORITHM_TYPE_VAR_CONSTRAINTS_TAG: string = "constraints";

    constructor() { }
    public static fileExists(filePath: string) {
        try {
            return fs.statSync(filePath).isFile();
        }
        catch (err) {
            return false;
        }
    }
    //Parse fmus json tag
    parseFmus(data: any, basePath: string): Promise<Fmu[]> {

        var fmus: Fmu[] = [];

        return new Promise<Fmu[]>((resolve, reject) => {

            var populates: Promise<void>[] = [];
            try {
                if (Object.keys(data).indexOf(this.FMUS_TAG) >= 0) {
                    $.each(Object.keys(data[this.FMUS_TAG]), (j, key) => {
                        var description = "";
                        var path = data[this.FMUS_TAG][key];
                        let correctedPath = Parser.fileExists(path) ? path : Path.normalize(basePath + "/" + path); 
                        let fmu = new Fmu(key, correctedPath);


                        populates.push(fmu.populate());
                        fmus.push(fmu);
                    });
                }
            } catch (e) {
                reject(e);
            }

            Promise.all(populates.map(p => p.catch(e => e)))
                .then(results => resolve(fmus))
                .catch(e => reject(e));
        });
    }


    parseId(id: string): string[] {
        //is must have the form: '{' + fmuName '}' + '.' instance-name + '.' + scalar-variable
        // restriction is that instance-name cannot have '.'

        let indexEndCurlyBracket = id.indexOf('}');
        if (indexEndCurlyBracket <= 0) {
            throw "Invalid id";
        }

        let fmuName = id.substring(0, indexEndCurlyBracket + 1);
        var rest = id.substring(indexEndCurlyBracket + 1);
        var dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after fmu name";
        }
        rest = rest.substring(dotIndex + 1);
        //this is instance-name start index 0

        dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after instance name";
        }
        let instanceName = rest.substring(0, dotIndex);
        let scalarVariableName = rest.substring(dotIndex + 1);

        return [fmuName, instanceName, scalarVariableName];
    }

    parseIdShort(id: string): string[] {
        //is must have the form: '{' + fmuName '}' + '.' instance-name 
        // restriction is that instance-name cannot have '.'

        let indexEndCurlyBracket = id.indexOf('}');
        if (indexEndCurlyBracket <= 0) {
            throw "Invalid id";
        }

        let fmuName = id.substring(0, indexEndCurlyBracket + 1);
        var rest = id.substring(indexEndCurlyBracket + 1);
        var dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after fmu name";
        }
        rest = rest.substring(dotIndex + 1);
        //this is instance-name start index 0

        let instanceName = rest;
        return [fmuName, instanceName];
    }

    //Utility method to obtain an instance from the multimodel by its string id encoding
    private getInstance(multiModel: MultiModelConfig, id: string): Instance {
        let ids = this.parseId(id);

        let fmuName = ids[0];
        let instanceName = ids[1];
        let scalarVariableName = ids[2];

        return multiModel.getInstanceOrCreate(fmuName, instanceName);
    }

    //parse connections
    parseConnections(data: any, multiModel: MultiModelConfig) {

        if (Object.keys(data).indexOf(this.CONNECTIONS_TAG) >= 0) {
            let connectionsEntry = data[this.CONNECTIONS_TAG];
            $.each(Object.keys(connectionsEntry), (j, id) => {

                let ids = this.parseId(id);

                let fmuName = ids[0];
                let instanceName = ids[1];
                let scalarVariableName = ids[2];

                var instance = this.getInstance(multiModel, id);

                let inputList = connectionsEntry[id];

                $.each(inputList, (j, inputId) => {
                    let inputIds = this.parseId(inputId);

                    let inFmuName = inputIds[0];
                    let inInstanceName = inputIds[1];
                    let inScalarVariableName = inputIds[2];

                    var inInstance = multiModel.getInstanceOrCreate(inFmuName, inInstanceName);

                    instance.addOutputToInputLink(instance.fmu.getScalarVariable(scalarVariableName),
                        new InstanceScalarPair(inInstance, inInstance.fmu.getScalarVariable(inScalarVariableName)));
                });
            });
        }
    }

    //parse parameters
    parseParameters(data: any, multiModel: MultiModelConfig) {
        var parameters: Map<String, any> = new Map<String, any>();

        if (Object.keys(data).indexOf(this.PARAMETERS_TAG) >= 0) {
            let parameterData = data[this.PARAMETERS_TAG];
            $.each(Object.keys(parameterData), (j, id) => {
                let value = parameterData[id];

                let ids = this.parseId(id);

                let fmuName = ids[0];
                let instanceName = ids[1];
                let scalarVariableName = ids[2];

                var instance = this.getInstance(multiModel, id);
                instance.initialValues.set(instance.fmu.getScalarVariable(scalarVariableName), value);
            });
        }

        return parameters;
    }


    parseSimpleTag(data: any, tag: string): any {
        return data[tag] !== undefined ? data[tag] : null;
    }

    parseStartTime(data: any): number {
        return parseFloat(this.parseSimpleTag(data, this.START_TIME_TAG));
    }

    parseEndTime(data: any): number {
        return parseFloat(this.parseSimpleTag(data, this.END_TIME_TAG));
    }

    parseMultiModelPath(data: any, projectRoot: string): string {
        return Path.normalize(projectRoot + "/" + this.parseSimpleTag(data, this.MULTIMODEL_PATH_TAG));
    }

    parseLivestream(data: any, multiModel: MultiModelConfig): Map<Instance, ScalarVariable[]> {
        let livestream = new Map<Instance, ScalarVariable[]>();
        let livestreamEntry = data[this.LIVESTREAM_TAG];

        if (livestreamEntry) {
            Object.keys(livestreamEntry).forEach(id => {
                let [fmuName, instanceName] = this.parseIdShort(id);
                let instance: Instance = multiModel.getInstanceOrCreate(fmuName, instanceName);

                livestream.set(instance, livestreamEntry[id].map((input:string) => instance.fmu.getScalarVariable(input)));
            });
        }

        return livestream;
    }

    parseAlgorithm(data: any, multiModel: MultiModelConfig): ICoSimAlgorithm {
        let algorithm = data[this.ALGORITHM_TAG];
        if (!algorithm) return;

        let type = algorithm[this.ALGORITHM_TYPE];

        if (type === this.ALGORITHM_TYPE_VAR)
            return this.parseAlgorithmVar(algorithm, multiModel);

        if (type === this.ALGORITHM_TYPE_FIXED)
            return this.parseAlgorithmFixed(algorithm);
    }

    private parseAlgorithmFixed(data: any): ICoSimAlgorithm {
        return new FixedStepAlgorithm(
            parseFloat(data[this.ALGORITHM_TYPE_FIXED_SIZE_TAG])
        );
    }

    private parseAlgorithmVar(data: any, multiModel: MultiModelConfig): ICoSimAlgorithm {
        let [minSize, maxSize] = this.parseSimpleTag(data, this.ALGORITHM_TYPE_VAR_SIZE_TAG);

        return new VariableStepAlgorithm(
            parseFloat(data[this.ALGORITHM_TYPE_VAR_INIT_SIZE_TAG]),
            parseFloat(minSize),
            parseFloat(maxSize),
            this.parseAlgorithmVarConstraints(data[this.ALGORITHM_TYPE_VAR_CONSTRAINTS_TAG], multiModel)
        );
    }

    private parseAlgorithmVarConstraints(constraints: any, multiModel: MultiModelConfig): Array<VariableStepConstraint> {
        return Object.keys(constraints).map(id => {
            let c = constraints[id];

            if (c.type === "zerocrossing") {
                return new ZeroCrossingConstraint(
                    id,
                    c.ports.map((id:string) => {
                        let [fmuName, instanceName, scalarVariableName] = this.parseId(id);
                        return multiModel.getInstanceScalarPair(fmuName, instanceName, scalarVariableName);
                    }),
                    c.order.toString(),
                    c.abstol,
                    c.safety
                )
            }

            if (c.type === "boundeddifference") {
                return new BoundedDifferenceConstraint(
                    id,
                    c.ports.map((id:string) => {
                        let [fmuName, instanceName, scalarVariableName] = this.parseId(id);
                        return multiModel.getInstanceScalarPair(fmuName, instanceName, scalarVariableName);
                    }),
                    c.abstol,
                    c.reltol,
                    c.safety,
                    c.skipDiscrete
                )
            }

            if (c.type === "samplingrate") {
                return new SamplingRateConstraint(
                    id,
                    c.base,
                    c.rate,
                    c.startTime
                )
            }
        });
    }
}



/*
 This is the Serializer class. It is placed here after the Parser which is the super class. See: http://stackoverflow.com/questions/24420500/typescript-error-runtime-error-cannot-read-property-prototype-of-undefined-wh data
 https://github.com/Microsoft/TypeScript/issues/5207 for more information
*/


export class Serializer extends Parser {
    constructor() {
        super();
    }

    public toObjectMultiModel(multiModel: MultiModelConfig, fmusRootPath: string): any {
        let obj:any = {};

        //fmus
        obj[this.FMUS_TAG] = this.toObjectFmus(multiModel.fmus, fmusRootPath);
        //connections
        obj[this.CONNECTIONS_TAG] = this.toObjectConnections(multiModel.fmuInstances);
        //parameters
        obj[this.PARAMETERS_TAG] = this.toObjectParameters(multiModel.fmuInstances);

        return obj;
    }

    public toObjectCoSimulationConfig(cc: CoSimulationConfig, projectRoot: string): any {
        let obj:any = {};

        let path = cc.multiModel.sourcePath;
        if (path.indexOf(projectRoot) >= 0) {
            path = path.substring(projectRoot.length + 1);
        }

        //multimodel source
        obj[this.MULTIMODEL_PATH_TAG] = path;

        //parameters
        // obj[this.PARAMETERS_TAG] = this.toObjectParameters(cc.fmuInstances);

        //start time
        obj[this.START_TIME_TAG] = cc.startTime;
        //end time
        obj[this.END_TIME_TAG] = cc.endTime;

        //livestream
        obj[this.LIVESTREAM_TAG] = this.toObjectLivestream(cc.livestream);

        //algorithm
        obj[this.ALGORITHM_TAG] = this.toObjectAlgorithm(cc.algorithm);

        return obj;
    }

    //convert fmus to JSON
    private toObjectFmus(fmus: Fmu[], fmusRootPath: string): any {
        let data:any = {};

        fmus.forEach((fmu: Fmu) => {
            let path = fmu.path;
            if (path.indexOf(fmusRootPath) >= 0) {
                path = path.substring(fmusRootPath.length + 1);
            }

            data[fmu.name] = path;
        });

        return data;
    }

    //util method to obtain id from instance
    public static getId(value: Instance): string {
        return value.fmu.name + "." + value.name;
    }

    //util method to obtain full id from instance and scalarvariable
    public static getIdSv(value: Instance, sv: ScalarVariable): string {
        return value.fmu.name + "." + value.name + "." + sv.name;
    }

    //toObjectConnections
    toObjectConnections(fmuInstances: Instance[]): any {
        let cons:any = {};

        fmuInstances.forEach(value => {
            value.outputsTo.forEach((pairs, sv) => {
                let key = Serializer.getIdSv(value, sv);
                let inputs: any[] = [];
                pairs.forEach(pair => {
                    let input = Serializer.getIdSv(pair.instance, pair.scalarVariable);
                    inputs.push(input);
                });

                cons[key] = inputs;
            });
        });

        return cons;
    }


    //to JSON parameters
    toObjectParameters(fmuInstances: Instance[]): any {
        let obj:any = {};

        fmuInstances.forEach(instance => {
            instance.initialValues.forEach((value, sv) => {
                obj[Serializer.getIdSv(instance, sv)] = value;
            });
        });

        return obj;
    }


    toObjectLivestream(livestream: Map<Instance, ScalarVariable[]>): any {
        let obj:any = {};

        livestream.forEach((svs, instance) => {
            obj[Serializer.getId(instance)] = svs.map(sv => sv.name);
        });

        return obj;
    }

    toObjectConstraint(constraint:any) {
        let object:any = {};

        Object.keys(constraint).forEach(key => {
            if (key === "id") return;

            if (key === "order")
                object[key] = parseFloat(constraint[key]);
            else if (key === "ports") {
                object[key] = constraint[key].map((port:InstanceScalarPair) => Serializer.getIdSv(port.instance, port.scalarVariable));
            } else {
                object[key] = constraint[key];
            }
        });

        return object;
    }

    toObjectAlgorithm(algorithm: ICoSimAlgorithm): any {
        let obj:any = {};

        if (algorithm instanceof FixedStepAlgorithm) {
            obj[this.ALGORITHM_TYPE] = this.ALGORITHM_TYPE_FIXED;
            obj[this.ALGORITHM_TYPE_FIXED_SIZE_TAG] = algorithm.size;

            return obj;
        }

        if (algorithm instanceof VariableStepAlgorithm) {
            let constraints:any = {};

            algorithm.constraints.forEach(c => constraints[c.id] = this.toObjectConstraint(c));

            obj[this.ALGORITHM_TYPE] = this.ALGORITHM_TYPE_VAR;
            obj[this.ALGORITHM_TYPE_VAR_INIT_SIZE_TAG] = algorithm.initSize;
            obj[this.ALGORITHM_TYPE_VAR_SIZE_TAG] = [algorithm.sizeMin, algorithm.sizeMax];
            obj[this.ALGORITHM_TYPE_VAR_CONSTRAINTS_TAG] = constraints;

            return obj;
        }

        return null;
    }
}
