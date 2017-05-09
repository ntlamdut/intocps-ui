import { CoSimulationConfig } from "./CoSimulationConfig"
import * as fs from "fs"
import * as Path from "path";
import { checksum } from "../proj/Project";

export function storeResultCrc(outputPath: string, coeConfig: CoSimulationConfig) {

    let coeCrc = checksum(fs.readFileSync(coeConfig.sourcePath).toString(), "md5", "hex");
    let mmCrc = coeConfig.multiModelCrc;
    let resultCrc = checksum(fs.readFileSync(outputPath).toString(), "md5", "hex");

    let res = { mm_config_crc: mmCrc, coe_config_crc: coeCrc, output_crc: resultCrc }

    let data = JSON.stringify(res);
    let file = Path.join(Path.dirname(outputPath), "result.json");
    console.info(data);

    return new Promise<void>((resolve, reject) => {
        try {

            fs.writeFile(file, data, error => {
                if (error)
                    reject(error);
                else
                    resolve();
            });
        } catch (error) {
            reject(error);
        }
    });
}

export function isResultValid(outputPath: string): boolean {

    let dir = Path.dirname(outputPath);
    let resultPath = Path.join(dir, "result.json");

    if (!fs.existsSync(resultPath)) {
        return true;//no check
    }

    let data = fs.readFileSync(resultPath, 'utf8');

    let obj = JSON.parse(data);
    //let res = { mm_config_crc: mmCrc, coe_config: coeCrc, result: resultCrc }
    let ok = true;

    let mmCrc = obj["mm_config_crc"];
    if (mmCrc != null) {
        let mmPath = Path.join(dir, "..", "..", "mm.json")
        //console.debug("MM path: " + mmPath);
        let crc = checksum(fs.readFileSync(mmPath).toString(), "md5", "hex");
        //console.debug("crc: " + mmCrc + " == " + crc);
        ok = ok && (crc == mmCrc);
    }
    let coeCrc = obj["coe_config_crc"];
    if (coeCrc != null) {
        
        let coePath = Path.join(dir, "..", "coe.json")
        if(!fs.existsSync(coePath))
        {
                //Backwards compatibility
                let file = fs.readdirSync(Path.join(dir, "..")).find(file => file.endsWith("coe.json"));
                coePath = Path.join(dir,"..",file);
                console.debug("Found old style coe at: " + coePath);
        }
        //console.debug("COE path: " + coePath);
        let crc = checksum(fs.readFileSync(coePath).toString(), "md5", "hex");
        //console.debug("crc: " + coeCrc + " == " + crc);
        ok = ok && (crc == coeCrc);

    }
    let outputCrc = obj["output_crc"];
    if (outputCrc != null) {
        //console.debug("Output path: " + outputPath);
        let crc = checksum(fs.readFileSync(outputPath).toString(), "md5", "hex");
        //console.debug("crc: " + outputCrc + " == " + crc);
        ok = ok && (crc == outputCrc);

    }


    return ok;
}
