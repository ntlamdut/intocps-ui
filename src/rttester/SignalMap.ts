
import fs = require("fs");

export class SignalMapEntry {
    lowerBound: number;
    upperBound: number;
    sutWritesToTE: boolean;
    teWritesToSUT: boolean;
    teReadConcreteSignalIdentifier: string;
    teReadSwitchVariable: string;
    teReadswitchValue: string;
    teWriteConcreteSignalIdentifier: string;
    teWriteSwitchVariable: string;
    teWriteSwitchValue: string;
    admissibleError: number;
    latency: number;
}

export class SignalMap {
    header: string = "";
    entries: { [variable: string]: SignalMapEntry } = {};
    constructor() { }
    static loadFromFile(fileName: string, callback: (map: SignalMap) => void) {
        let map = new SignalMap();
        let self = this;
        let isFirstLine = true;
        var lineReader = require("readline").createInterface({
            input: require("fs").createReadStream(fileName)
        });
        lineReader.on("line", (line: string) => {
            if (isFirstLine) {
                isFirstLine = false;
                map.header = line;
            } else {
                let cells = line.split(";");
                let e = new SignalMapEntry();
                map.entries[cells[0]] = e;
                e.lowerBound = +cells[1];
                e.upperBound = +cells[2];
                e.sutWritesToTE = cells[3] == "1";
                e.teWritesToSUT = cells[4] == "1";
                e.teReadConcreteSignalIdentifier = cells[5];
                e.teReadSwitchVariable = cells[6];
                e.teReadswitchValue = cells[7];
                e.teWriteConcreteSignalIdentifier = cells[8];
                e.teWriteSwitchVariable = cells[9];
                e.teWriteSwitchValue = cells[10];
                e.admissibleError = +cells[11];
                e.latency = +cells[12];
            }
        });
        lineReader.on("close", () => { callback(map); });
    }
    saveToFile(fileName: string, callback: (error: any) => void) {
        let s = "";
        s += this.header + "\n";
        for (let v in this.entries) {
            s += v;
            s += ";" + this.entries[v].lowerBound;
            s += ";" + this.entries[v].upperBound;
            s += ";" + (this.entries[v].sutWritesToTE ? 1 : 0);
            s += ";" + (this.entries[v].teWritesToSUT ? 1 : 0);
            s += ";" + this.entries[v].teReadConcreteSignalIdentifier;
            s += ";" + this.entries[v].teReadSwitchVariable;
            s += ";" + this.entries[v].teReadswitchValue;
            s += ";" + this.entries[v].teWriteConcreteSignalIdentifier;
            s += ";" + this.entries[v].teWriteSwitchVariable;
            s += ";" + this.entries[v].teWriteSwitchValue;
            s += ";" + this.entries[v].admissibleError;
            s += ";" + this.entries[v].latency;
            s += ";\n";
        }
        fs.writeFile(fileName, s, callback);
    }
}
