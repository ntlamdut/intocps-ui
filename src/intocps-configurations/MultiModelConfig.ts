import {Parser, Serializer} from "./Parser";
import {WarningMessage, ErrorMessage} from "./Messages";
import {
    Fmu, Instance, ScalarVariableType, isTypeCompatipleWithValue,
    isTypeCompatiple, InstanceScalarPair
} from "../angular2-app/coe/models/Fmu";
import * as Path from 'path';
import * as fs from 'fs';

// Multi-Model

export class MultiModelConfig implements ISerializable {

    //path to the source from which this DOM is generated
    sourcePath: string;
    fmusRootPath: string;
    fmus: Fmu[] = [];
    fmuInstances: Instance[] = [];
    instanceScalarPairs: InstanceScalarPair[] = [];

    public getInstance(fmuName: string, instanceName: string) {
        return this.fmuInstances.find(v => v.fmu.name == fmuName && v.name == instanceName) || null;
    }

    public getInstanceOrCreate(fmuName: string, instanceName: string) {
        let instance = this.getInstance(fmuName, instanceName);

        if (instance == null) {
            //multimodel does not contain this instance
            let fmu = this.getFmu(fmuName);

            if (fmu == null) {
                throw "Cannot create connection fmu is missing for: " + fmuName;
            }

            instance = new Instance(fmu, instanceName);
            this.fmuInstances.push(instance);
        }

        return instance;
    }

    public getFmu(fmuName: string): Fmu {
        return this.fmus.find(v => v.name == fmuName) || null;
    }

    getInstanceScalarPair(fmuName:string, instanceName:string, scalarName:string):InstanceScalarPair {
        let pair = this.instanceScalarPairs.find(pair => {
            return pair.instance.fmu.name === fmuName && pair.instance.name === instanceName && pair.scalarVariable.name === scalarName;
        });

        if (pair)
            return pair;

        let instance = this.getInstance(fmuName, instanceName);
        let scalar = instance.fmu.getScalarVariable(scalarName);

        pair = new InstanceScalarPair(instance, scalar);
        this.instanceScalarPairs.push(pair);

        return pair;
    }

    static create(path: string, fmuRootPath: string, data: any): Promise<MultiModelConfig> {
        let parser = new Parser();

        let mm = new MultiModelConfig();
        mm.sourcePath = path;
        mm.fmusRootPath = fmuRootPath;

        return parser
            .parseFmus(data, Path.normalize(fmuRootPath))
            .then(fmus => {
                mm.fmus = fmus;

                parser.parseConnections(data, mm);
                parser.parseParameters(data, mm);

                return mm;
            });
    }

    static parse(path: string, fmuRootPath: string): Promise<MultiModelConfig> {
        return new Promise<Buffer>((resolve, reject) => {
                fs.readFile(path, (error, data) => {
                    if (error)
                        reject(error);
                    else
                        resolve(data);
                });
            }).then(content => this.create(path, fmuRootPath, JSON.parse(content.toString())));
    }

    public removeFmu(fmu: Fmu) {
        this.fmus.splice(this.fmus.indexOf(fmu), 1);
        
        this.fmuInstances
            .filter(element => element.fmu == fmu)
            .forEach(element => this.removeInstance(element));
    }

    public removeInstance(instance: Instance) {
        // Remove the instance
        this.fmuInstances.splice(this.fmuInstances.indexOf(instance), 1);

        // When removing an instance, all connections to this instance must be removed as well.  
        this.fmuInstances.forEach(element => {
            element.outputsTo.forEach(value => {
                for (let i = value.length - 1; i >= 0; i--) {
                    if (value[i].instance == instance) {
                        value.splice(i, 1);
                    }
                }
            });
        });
    }

    toObject(): any {
        return new Serializer().toObjectMultiModel(this, this.fmusRootPath);
    }

    validate(): WarningMessage[] {
        let messages: WarningMessage[] = [];

        // perform check
        this.fmuInstances.forEach(instance => {
            //check connections
            instance.outputsTo.forEach((pairs, sv) => {
                if (sv.isConfirmed) {
                    pairs.forEach(pair => {
                        if (pair.scalarVariable.isConfirmed) {
                            if (!isTypeCompatiple(sv.type, pair.scalarVariable.type)) {
                                messages.push(new ErrorMessage(`Uncompatible types in connection. The output scalar variable "${sv.name}": ${sv.type} is connected to scalar variable "${pair.scalarVariable.name}": ${pair.scalarVariable.type}`));
                            }
                        } else {
                            messages.push(new WarningMessage(`Use of unconfirmed ScalarVariable: "${pair.scalarVariable.name}" as connection input`));
                        }
                    });
                } else {
                    messages.push(new WarningMessage(`Use of unconfirmed ScalarVariable: "${sv.name}" as connection output`));
                }
            });

            //check parameters
            instance.initialValues.forEach((value, sv) => {
                if (sv.isConfirmed) {
                    if (!isTypeCompatipleWithValue(sv.type, value)) {
                        messages.push(new ErrorMessage(`Uncompatible types for parameter. ScalarVariable: "${sv.name}" ${ScalarVariableType[sv.type]}  Value: ${value} ${typeof(value)}`));
                    }
                } else {
                    messages.push(new WarningMessage(`Use of unconfirmed ScalarVariable: "${sv.name}" as parameter`));
                }
            });
        });

        return messages;
    }

    save(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let messages = this.validate();

            if (messages.length > 0)
                reject(messages);

            fs.writeFile(this.sourcePath, JSON.stringify(this.toObject()), error => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        });
    }
}
