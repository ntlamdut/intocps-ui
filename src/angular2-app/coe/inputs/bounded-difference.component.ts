import {Component, Input} from "@angular/core";
import {BoundedDifferenceConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance, CausalityType} from "../models/Fmu";

@Component({
    selector: 'bounded-difference',
    templateUrl: "./angular2-app/coe/inputs/bounded-difference.component.html",
})
export class BoundedDifferenceComponent {
    @Input()
    constraint:BoundedDifferenceConstraint;

    @Input()
    fmuInstances:Array<Instance>;

    getPorts() {
        var ports = [];

        this.fmuInstances.forEach(instance => {
            instance.fmu.scalarVariables
                .filter(sv => sv.causality === CausalityType.Output)
                .forEach(sv => ports.push(sv));
        });

        return ports;
    }


    addPort() {
        this.constraint.ports.push(this.getPorts()[0]);
    }

    removePort(port) {
        let index = this.constraint.ports.indexOf(port);

        if (index > -1)
            this.constraint.ports.splice(index, 1);
    }
}