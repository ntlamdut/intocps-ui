import * as Configs from "../../intocps-configurations/intocps-configurations";
import {InstanceListElement} from "../../multimodel/connections/connections-instance-element";
import {CheckboxInstanceListElement} from "../../multimodel/connections/checkbox-list-element";
import {Component} from "../../multimodel/components/component";
export class LivestreamConfiguration {
    private container: HTMLElement;
    private instancesULId = "livestream-instances";
    private instancesListUL: HTMLUListElement;
    private variablesULId = "livestream-variables";
    private variablesListUL: HTMLUListElement;
    private instances: Configs.Instance[];
    private instancesUI: InstanceListElement<Configs.Instance>[] = new Array<InstanceListElement<Configs.Instance>>();
    private selectedInstanceUI: InstanceListElement<Configs.Instance>;

    private variablesUI: CheckboxInstanceListElement<Configs.ScalarVariable>[] = new Array<CheckboxInstanceListElement<Configs.ScalarVariable>>();
    private unconfirmedText: string = "Variable is unconfirmed";

    private livestream: Map<Configs.Instance, Configs.ScalarVariable[]>;

    constructor(container: HTMLElement, instances: Configs.Instance[], livestream: Map<Configs.Instance, Configs.ScalarVariable[]>) {
        this.container = container;
        this.instances = instances;
        this.livestream = livestream;
        this.initializeUi();
    }

    private initializeUi() {
        this.instancesListUL = <HTMLUListElement>this.container.querySelector("#" + this.instancesULId);
        this.variablesListUL = <HTMLUListElement>this.container.querySelector("#" + this.variablesULId);
        let self = this;
        this.instances.forEach(element => {
            $('<div>').load("./multimodel/connections/list-element.html", function (event: JQueryEventObject) {
                let html: HTMLLinkElement = <HTMLLinkElement>(<HTMLUListElement>this).firstChild;
                let instanceUI = new InstanceListElement<Configs.Instance>(html,
                    "" + element.fmu.name + "." + element.name,
                    self.onInstanceSelect.bind(self), element);
                self.instancesListUL.appendChild(html);
                self.instancesUI.push(instanceUI);
            });

        });
    }

    private onInstanceSelect(element: InstanceListElement<Configs.Instance>) {       
        let addInputVariable = (variable: Configs.ScalarVariable, selected: boolean) => {
            let self = this;
            $('<div>').load("multimodel/connections/input.html", function (event: BaseJQueryEventObject) {
                let html: HTMLLinkElement = <HTMLLinkElement>(<HTMLDivElement>this).firstChild;
                self.variablesListUL.appendChild(html);
                let output: CheckboxInstanceListElement<Configs.ScalarVariable> = new CheckboxInstanceListElement(html, variable.name, self.onVariableSelect.bind(self), variable);
                if (!variable.isConfirmed) {
                    output.setWarning(self.unconfirmedText);
                }
                output.setCheckboxState(selected);
                self.variablesUI.push(output);
            });
        }

        let loadCorrespondingVariables = (instance: Configs.Instance) => {
            // Find the connected variables
            let connectedVariables = this.livestream.get(instance);
            // Find all output variables
            let outputVariables = instance.fmu.scalarVariables.filter(element => { return element.causality == Configs.CausalityType.Output });
            outputVariables.forEach(element => {
                addInputVariable(element, connectedVariables != null ? connectedVariables.some(elem => { return elem === element }) : false);
            });
        }

        this.instancesUI.forEach(elem => {
            if (element !== elem) {
                elem.deselect();
            }
        });
        Component.clearContainer(this.variablesListUL);
        this.variablesUI.length = 0;
        loadCorrespondingVariables(element.getInstance());
        this.selectedInstanceUI = element;
    }
    
    private onVariableSelect(element: CheckboxInstanceListElement<Configs.ScalarVariable>) {
        let getVariablesForInstance = (instance: Configs.Instance) => {
            let variablesForInstance = this.livestream.get(instance);
            if (variablesForInstance == null) {
                variablesForInstance = new Array<Configs.ScalarVariable>();
                this.livestream.set(instance, variablesForInstance);
            }
            return variablesForInstance;
        }
        let instance = this.selectedInstanceUI.getInstance();
        let variablesForInstance = getVariablesForInstance(instance);
        
        let variable = element.getInstance();
        if (element.getChecked()) {
            variablesForInstance.push(variable);
        }
        else {
            variablesForInstance.splice(variablesForInstance.indexOf(variable),1);
            if(variablesForInstance.length == 0){
                this.livestream.delete(instance);
            }
        }
    }
}