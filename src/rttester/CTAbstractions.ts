
import fs = require("fs");


export interface Output {
    name: string;
    type: string;
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
