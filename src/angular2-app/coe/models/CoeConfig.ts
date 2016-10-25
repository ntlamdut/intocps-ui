import * as Path from 'path';
import { CoSimulationConfig } from "../../../intocps-configurations/CoSimulationConfig";

export class CoeConfig {
    constructor(private coSimConfig: CoSimulationConfig, private remoteCoe: boolean = false) {

    }

    toJSON(): string {
        let fmus: any = {};

        this.coSimConfig.multiModel.fmus.forEach(fmu => {
            fmus[fmu.name] = (this.remoteCoe ? Path.join("session:", Path.basename(fmu.path)) : "file:///" + fmu.path).replace(/\\/g, "/");
        });

        let data: any = {};

        //FMUS
        Object.assign(data, this.coSimConfig.multiModel.toObject(), this.coSimConfig.toObject());

        delete data["endTime"];
        delete data["startTime"];
        delete data["multimodel_path"];
        delete data["enableAllLogCategoriesPerInstance"];
        if (!data["visible"])
            delete data["visible"];
        if (!data["loggingOn"])
            delete data["loggingOn"];


        data["fmus"] = fmus;

        return JSON.stringify(data);
    }
}





