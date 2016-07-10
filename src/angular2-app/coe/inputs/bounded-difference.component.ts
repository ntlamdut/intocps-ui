import {Component, Input} from "@angular/core";
import {BoundedDifferenceConstraint} from "../../../intocps-configurations/CoSimulationConfig";
import {Instance, CausalityType, InstanceScalarPair} from "../models/Fmu";

@Component({
    selector: 'bounded-difference',
    templateUrl: "./angular2-app/coe/inputs/bounded-difference.component.html",
})
export class BoundedDifferenceComponent {
    @Input()
    constraint:BoundedDifferenceConstraint;

    @Input()
    ports:Array<InstanceScalarPair>;

    customTrackBy(index:number, obj: any):any {
        return index;
    }

    addPort() {
        this.constraint.ports.push(this.ports[0]);
    }

    removePort(port) {
        let index = this.constraint.ports.indexOf(port);

        if (index > -1)
            this.constraint.ports.splice(index, 1);
    }
}