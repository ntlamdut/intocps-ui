import {ProjectSettings} from "./ProjectSettings"

export interface IProject {
    getName(): string;
    getRootFilePath(): string;
    getProjectConfigFilePath(): string;
    getFmusPath(): string;
    getSysMlFolderName(): String;
    save():void;

    createMultiModel(name: String, jsonContent: String): String;
    createDse(name: String, jsonContent: String): String;
    createSysMLDSEConfig(name: String, jsonContent: String): String;
    createCoSimConfig(multimodelConfigPath: string, name: String, jsonContent: String): string;

    getSettings(): ProjectSettings;

    freshMultiModelName(name : String): String;
    freshFilename(path: string, name: string) : string
}
