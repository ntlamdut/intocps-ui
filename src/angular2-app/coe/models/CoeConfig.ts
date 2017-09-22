import * as Path from 'path';
import { CoSimulationConfig } from "../../../intocps-configurations/CoSimulationConfig";
import { Instance, ScalarVariable } from "../models/Fmu"
import { Serializer } from "../../../intocps-configurations/Parser"

export class CoeConfig {
    constructor(private coSimConfig: CoSimulationConfig, private remoteCoe: boolean = false) {

    }

    toJSON(): string {
        let fmus: any = {};

        this.coSimConfig.multiModel.fmus.forEach(fmu => {
            fmus[fmu.name] = (this.remoteCoe ? Path.join("session:", Path.basename(fmu.path)) : "file:///" + fmu.path).replace(/\\/g, "/").replace(/ /g, "%20");
        });

        let data: any = {};

        let livestream: Map<Instance, ScalarVariable[]> = new Map<Instance, ScalarVariable[]>();

        if (this.coSimConfig.liveGraphs) {
            this.coSimConfig.liveGraphs.forEach(g => {

                if (g.getLivestream()) {
                    g.getLivestream().forEach((svs, ins: Instance) => {


                        if (livestream.has(ins)) {
                            let list: any= [];
                            g.getLivestream().get(ins).forEach(sv => {
                                if (list.indexOf(sv) < 0) {
                                    list.push(sv);
                                }
                            });

                            livestream.set(ins, list);
                        }
                        else {
                            livestream.set(ins, g.getLivestream().get(ins));
                        }
                    });
                }

            });
        }

        //FMUS
        Object.assign(data, this.coSimConfig.multiModel.toObject(), this.coSimConfig.toObject());

        delete data["endTime"];
        delete data["startTime"];
        delete data["multimodel_path"];
        delete data["multimodel_crc"];
        delete data["enableAllLogCategoriesPerInstance"];
        delete data["postProcessingScript"];

        let livestreamData: any = {};
        livestream.forEach((svs, instance) => livestreamData[Serializer.getId(instance)] = svs.map(sv => sv.name));
        data["livestream"] = livestreamData;

        if (data["graphs"])
            delete data["graphs"];



        if (!data["livestreamInterval"])
            delete data["livestreamInterval"];
        if (!data["visible"])
            delete data["visible"];
        if (!data["loggingOn"])
            delete data["loggingOn"];

        if (data["overrideLogLevel"] === null || data["overrideLogLevel"] === "Not set")
            delete data["overrideLogLevel"];

        data["fmus"] = fmus;

        return JSON.stringify(data);
    }
}





