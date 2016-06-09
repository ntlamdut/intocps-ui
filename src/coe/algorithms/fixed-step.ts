import * as Configs from "../../intocps-configurations/intocps-configurations";
import * as TextInput from "../components/text-input-non-load";
import {Utilities} from "../../utilities";
export class FixedStep{
    private container: HTMLElement;
    private algorithm: Configs.FixedStepAlgorithm;
    private textInput : TextInput.TextInputNonLoad;
    constructor(container: HTMLElement, algorithm: Configs.FixedStepAlgorithm){
        this.container = container;
        this.algorithm = algorithm;
        this.initializeUI();
    }
    
    private initializeUI(){
        this.textInput = new TextInput.TextInputNonLoad(this.container, this.algorithm.size.toString(), this.sizeChanged.bind(this),
        new TextInput.TextInputIds("fixed-step-text", "fixed-step-editOkButton", "fixed-step-cancelButton"));
    }
    
    private sizeChanged(size: string){
        return Utilities.timeStringToNumberConversion(size, (val: number) => {this.algorithm.size = val;});
    }
}
