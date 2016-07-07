import * as Path from 'path';
import {CoSimulationConfig} from "../../../intocps-configurations/CoSimulationConfig";

export class CoeConfig {
    private coSimConfig:CoSimulationConfig;
    private remoteCoe:boolean = false;

    constructor(coSimConfig: CoSimulationConfig, remoteCoe: boolean) {
        this.coSimConfig = coSimConfig;
        this.remoteCoe = remoteCoe;
    }

    toJSON():string {
        let fmus:any = {};

        this.coSimConfig.multiModel.fmus.forEach(fmu => {
            fmus[fmu.name] = this.remoteCoe ? Path.join("session:", Path.basename(fmu.path)) : fmu.path;
        });

        let data:any = {};

        //FMUS
        Object.assign(data,
            this.coSimConfig.multiModel.toObject(),
            this.coSimConfig.toObject());

        delete data["endTime"];
        delete data["startTime"];
        delete data["multimodel_path"];

        data["fmus"] = fmus;

        return JSON.stringify(data);
    }
}





