import {Component, Input} from "@angular/core";
import {ZeroCrossingConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance, CausalityType, InstanceScalarPair} from "../models/Fmu";

@Component({
    selector: 'zero-crossing',
    templateUrl: "./angular2-app/coe/inputs/zero-crossing.component.html"
})
export class ZeroCrossingComponent {
    @Input()
    constraint:ZeroCrossingConstraint;

    @Input()
    ports:Array<InstanceScalarPair> = [];

    customTrackBy(index:number, obj: any):any {
        return index;
    }

    addPort() {
        if (this.constraint.ports.length >= 2) return;

        this.constraint.ports.push(this.ports[0]);
    }

    removePort(port:InstanceScalarPair) {
        let index = this.constraint.ports.indexOf(port);

        if (index > -1)
            this.constraint.ports.splice(index, 1);
    }
}