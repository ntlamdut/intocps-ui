import { CoSimulationConfig } from "./CoSimulationConfig"
import { MultiModelConfig } from "./MultiModelConfig"
import { ScalarVariable } from "../angular2-app/coe/models/Fmu"
import IntoCpsApp from "./../IntoCpsApp";

type valueReference = number;
type name = string;
export class FmuImploder {

    public static implodeConfig(path: string) {
        let project = IntoCpsApp.getInstance().getActiveProject();

        CoSimulationConfig.parse(path, project.getRootFilePath(), project.getFmusPath()).then(config => {
            this
        });
    }

    private config: CoSimulationConfig;

    constructor(config: CoSimulationConfig) {
        this.config = config;
    }


    private createModelDescriptionCOE(mmConfig: MultiModelConfig) {
        let vendorAnnotation: Map<valueReference, name> = new Map<valueReference, name>();
        let inputs: Array<ScalarVariable> = new Array<ScalarVariable>();
        let outputs: Array<ScalarVariable> = new Array<ScalarVariable>();

        for (let fmu in mmConfig.fmus) {
            let 
        }

        // Get all the outputs from all FMUs -- This might not be intended behaviour.
        // Get the inputs that are not connected from all FMUs
        // Create VendorAnnotations as we go
    }
}