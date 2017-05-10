import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import { numberValidator } from "../angular2-app/shared/validators";
import * as fs from "fs"
import { DseParser } from "./dse-parser"

export class DseConfiguration implements ISerializable {
    sourcePath: string;
    searchAlgorithm: IDseAlgorithm = new ExhaustiveSearch();

    toObject() {
        return {
            searchAlgorithm: this.searchAlgorithm
        }
    }

    static parse(path: string): Promise<DseConfiguration> {
        return new Promise<DseConfiguration>((resolve, reject) => {
            fs.access(path, fs.constants.R_OK, error => {
                if (error) return reject(error);
                fs.readFile(path, (error, content) => {
                    if (error) return reject(error);
                    this.create(path, JSON.parse(content.toString()))
                        .then(dseConfig => resolve(dseConfig))
                        .catch(error => reject(error));
                });
            });
        });
    }

    static create(path:string, data: any): Promise<DseConfiguration> {
        return new Promise<DseConfiguration>((resolve, reject) => {
            let parser = new DseParser();
            let configuration = new DseConfiguration();
            configuration.searchAlgorithm = parser.parseSearchAlgorithm(data)
            configuration.sourcePath = path;
            resolve(configuration)
        })

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
}

export interface IDseAlgorithm {
    toFormGroup(): FormGroup;
    toObject(): { [key: string]: any };
    type: string;
    name: string;
}


export class GeneticSearch implements IDseAlgorithm {
    type = "genetic";
    name = "Genetic";

    constructor(
        public initialPopulation: number = 0,
        public randomBalanced: string = "random",
        public terminationRounds: number = 0
    ) {

    }

    toFormGroup() {
        return new FormGroup({
            initialPopulation: new FormControl(this.initialPopulation, [Validators.required, numberValidator]),
            randomBalanced: new FormControl(this.randomBalanced, [Validators.required]),
            terminationRounds: new FormControl(this.terminationRounds, [Validators.required, numberValidator])
        });
    }

    toObject() {
        return {
            type: this.type,
            initialPopulation: Number(this.initialPopulation),
            randomBalanced: String(this.randomBalanced),
            terminationRounds: Number(this.terminationRounds)
        };
    }
}

export class ExhaustiveSearch implements IDseAlgorithm {
    type = "exhaustive";
    name = "Exhaustive";

    constructor() {

    }

    toFormGroup() {
        return new FormGroup({});
    }

    toObject() {
        return {
            type: this.type,
        };
    }
}
