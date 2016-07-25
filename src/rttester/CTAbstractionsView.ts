
import {ViewController} from "../iViewController";
import {Abstractions, Interface, Output, Component} from "../rttester/CTAbstractions";


let makeAbstractionTreeID = (function () {
    let counter = 0;
    return function () { return "AbstractionTreeId" + counter++; };
})();

export class CTAbstractionsView extends ViewController {

    jsonFileName: string;
    abstractions: any;


    constructor(protected viewDiv: HTMLDivElement, jsonFileName: string) {
        super(viewDiv);
        this.jsonFileName = jsonFileName;
        this.abstractions = Abstractions.loadFromJSON(jsonFileName);
        this.displayAbstractions();
    }

    displayAbstractions(): void {

        let createOutputNode = (o: Output) => {
            return {
                id: makeAbstractionTreeID(),
                text: o.name + ": " + o.type,
                img: "icon-folder"
            };
        };

        let createOutputInterfaceNode = (i: Interface) => {
            return {
                id: makeAbstractionTreeID(),
                text: i.name,
                nodes: i.outputs.map((o: Output) => createOutputNode(o))
            };
        };

        let createComponentNode = (c: Component) => {
            return {
                id: makeAbstractionTreeID(),
                text: c.name,
                img: "icon-folder",
                nodes: c.outputInterfaces.map((i: Interface) => createOutputInterfaceNode(i)),
                expanded: true
            };
        };

        $("#AbstractionsTree").w2sidebar({
        name: makeAbstractionTreeID(),
            menu: [],
            nodes: this.abstractions.components.map((c: Component) => createComponentNode(c))
        });
    }

}

