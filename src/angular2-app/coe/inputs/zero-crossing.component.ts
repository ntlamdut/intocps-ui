import {Component, Input} from "@angular/core";
import {ZeroCrossingConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance, CausalityType} from "../models/Fmu";

@Component({
    selector: 'zero-crossing',
    templateUrl: "./angular2-app/coe/inputs/zero-crossing.component.html",
})
export class ZeroCrossingComponent {
    @Input()
    constraint:ZeroCrossingConstraint;

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
        if (this.constraint.ports.length >= 2) return;

        this.constraint.ports.push(this.getPorts()[0]);
    }

    removePort(port) {
        let index = this.constraint.ports.indexOf(port);

        if (index > -1)
            this.constraint.ports.splice(index, 1);
    }
}