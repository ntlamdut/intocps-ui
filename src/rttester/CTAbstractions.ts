
import fs = require("fs");

export class RangeBasedAbstraction {
    lowerBound: Number;
    upperBound: Number;
    constructor() {
        this.lowerBound = this.upperBound = 0;
    }
}

export class GradientBasedAbstraction {
    gradient: Number;
    timeFrame: Number;
    constructor() {
        this.gradient = 0;
        this.timeFrame = 1000;
    }
}

export class SimulationBasedAbstraction {
    fileName: string;
    maxValueRange: Number;
    constructor() {
        this.fileName = null;
        this.maxValueRange = 1;
    }
}

export class Abstraction {
    selected: string;
    rangeBased: RangeBasedAbstraction;
    gradientBased: GradientBasedAbstraction;
    simulationBased: SimulationBasedAbstraction;
    constructor() {
        this.selected = "none";
        this.rangeBased = new RangeBasedAbstraction();
        this.gradientBased = new GradientBasedAbstraction();
        this.rangeBased = new RangeBasedAbstraction();
        this.simulationBased = new SimulationBasedAbstraction();
    }
}

export class Input {
    name: string;
    type: string;
    abstraction: Abstraction;
    constructor() {
        this.abstraction = new Abstraction();
    }
}

export interface Interface {
    name: string;
    inputs: Input[];
}

export interface Component {
    name: string;
    inputInterfaces: Interface[];
}

export class Abstractions {
    components: Component[];
    static loadFromJSON(fileName: string): Abstractions {
        let str = fs.readFileSync(fileName).toString();
        return JSON.parse(str);
    }
    static writeToJSON(a: Abstractions, fileName: string) {
        fs.writeFileSync(fileName, JSON.stringify(a, null, 4), { encoding: "utf8" });
    }
}
