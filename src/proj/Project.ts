
import fs = require('fs');
import Path = require('path');

import { IProject } from "./IProject"
import { ProjectSettings } from "./ProjectSettings"
import {DseConfiguration} from "../intocps-configurations/dse-configuration"

export class Project implements IProject {

    name: string;
    rootPath: string;
    configPath: string;
    /**
     * The maximum number to be concatenated to filenames when a fresh name is needed
     */
    MAX_NEW_FILENAME: number = 100; 


    PATH_FMUS: string = "FMUs";
    PATH_MODELS: string = "Models";
    static PATH_MULTI_MODELS: string = "Multi-models";
    static PATH_DSE: string = "DSEs";
    //PATH_CONNECTIONS: String = "SysML Connections";
    static PATH_SYSML: string = "SysML";
    static PATH_TEST_DATA_GENERATION: string = "Test-Data-Generation";
    static PATH_TRACEABILITY: string = "Traceability";
    static PATH_MODEL_CHECKING: string = "Model-Checking";

    constructor(name: string, rootPath: string, configPath: string) {
        this.name = name;
        this.rootPath = rootPath;
        this.configPath = configPath;
        //  this.containers = containers;
        // this.configs= configs;
        // this.conMaps = conMaps;
    }

    public getName(): string {
        return this.name;
    }


    public getRootFilePath(): string { return this.rootPath; }
    public getProjectConfigFilePath(): string { return this.configPath }
    public getFmusPath(): string { return Path.normalize(this.getRootFilePath() + "/" + this.PATH_FMUS); }

    public getSysMlFolderName(): String {
        return Project.PATH_SYSML;
    }

    //TODO: replace with proper folder struct
    public save() {

        let folders = [Project.PATH_SYSML, Project.PATH_DSE, this.PATH_FMUS, this.PATH_MODELS, Project.PATH_MULTI_MODELS,
        Project.PATH_TEST_DATA_GENERATION, Project.PATH_MODEL_CHECKING, Project.PATH_TRACEABILITY];

        for (var i = 0; folders.length > i; i++) {
          try {
            var folder = folders[i];
            let path = Path.normalize(this.rootPath + "/" + folder);
            if (!fs.existsSync(path)) {
              fs.mkdir(path, function (err) { });
            }
          } 
          catch (e) {
            //already exists
          }
          //create empty ignore file for folder
        }

        fs.open(this.configPath, "w", (err, fd) => {
            if (err) {
                "The error: " + err + " happened when attempting to open the file: " + this.configPath + " for writing.";
            }
            else {
                var obj: any = new Object();
                Object.assign(obj, this);
                obj.configPath = "";
                obj.rootPath = "";


                fs.write(fd, JSON.stringify(obj), (err) => {
                    if (err) {
                        console.log("Failed to write settings in : " + this.configPath + ".");
                    }
                    else {
                        console.log("Stored settings in : " + this.configPath + ".");
                    }
                    fs.close(fd, (err) => {
                        if (err) {
                            console.log("Failed to close writing to the file: " + this.configPath + ".");
                            throw err;
                        }
                    });
                });
            }
        });

        /*    for (let c of this.configs) {
               c.save();
           }
   
           for (let c of this.conMaps) {
               c.save();
           }*/
    }

    public createMultiModel(name: String, jsonContent: String): String {
        let path = Path.normalize(this.rootPath + "/" + Project.PATH_MULTI_MODELS + "/" + name);

        if(fs.existsSync(path)) throw new Error('Multi-Model '+  name + ' already exists!');

        fs.mkdirSync(path);

        let fullpath = Path.normalize(path + "/mm.json");

        fs.writeFileSync(fullpath, jsonContent == null ? "{}" : jsonContent, "UTF-8");

        return fullpath;
    }

    public createSysMLDSEConfig(name: String, jsonContent: String): String {
        let path = Path.normalize(this.rootPath + "/" + Project.PATH_DSE + "/" + name);

        fs.mkdirSync(path);

        let fullpath = Path.normalize(path + "/"+name+".dse.json");

        fs.writeFileSync(fullpath, jsonContent == null ? "{}" : jsonContent, "UTF-8");

        return fullpath;
    }

    public createDse(name: String, jsonContent: String): String {
        let path = Path.normalize(this.rootPath + "/" + Project.PATH_DSE + "/" + name);

        fs.mkdirSync(path);

        let fullpath = Path.normalize(path + "/" + name + ".dse.json");

        fs.writeFileSync(fullpath, jsonContent, "UTF-8");

        return fullpath;
    }

    public createCoSimConfig(multimodelConfigPath: string, name: String, jsonContent: String): string {
        let mmDir = Path.dirname(multimodelConfigPath);
        let path = Path.normalize(mmDir + "/" + name);

        fs.mkdirSync(path);

        let fullpath = Path.normalize(path + "/coe.json");

        var data = jsonContent == null ? "{\"algorithm\":{\"type\":\"fixed-step\",\"size\":0.1},\"endTime\":10,\"startTime\":0}" : jsonContent;
        console.info(data);
        var json = JSON.parse(data + "");
        json["multimodel_crc"] = checksum(fs.readFileSync(multimodelConfigPath).toString(), "md5", "hex");

        data = JSON.stringify(json);
        console.info(data);
        fs.writeFileSync(fullpath, data, "UTF-8");

        return fullpath;
    }

    public getSettings() {
        return new ProjectSettings(this);
    }


    public freshMultiModelName(name : string): string { 
        return this.freshFilename(Path.normalize(this.rootPath + "/" + Project.PATH_MULTI_MODELS),name); 
    }


    /**
     * Returns a fresh filename inside folder path with name as a prefix. 
     * @param {string} path 
     * @param {string} name 
     */
    public freshFilename(path: string, name: string) : string
    {
        var filepath : string;
        var newname : string = name; 

        for (var i = 1; i < this.MAX_NEW_FILENAME; i++)
            {
                filepath = Path.format({ dir : path,
                                         base : newname, 
                                         root : null, 
                                         name : null, 
                                         ext : null
                                        });

                if(!fs.existsSync(filepath)) return newname;        

                newname = name +'-'+ i;
            }
            
        return name;
    }



}

export function checksum(str: string, algorithm: any, encoding: any): string {
    var crypto = require('crypto');
    return crypto
        .createHash(algorithm || 'md5')
        .update(str, 'utf8')
        .digest(encoding || 'hex')
}

