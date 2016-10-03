
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
    constructor() {
        this.gradient = 0;
    }
}

export class SimulationBasedAbstraction {
    fileName: string;
    constructor() {
        this.fileName = null;
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

export class Output {
    name: string;
    type: string;
    abstraction: Abstraction;
    constructor() {
        this.abstraction = new Abstraction();
    }
}

export interface Interface {
    name: string;
    outputs: Output[];
}

export interface Component {
    name: string;
    outputInterfaces: Interface[];
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