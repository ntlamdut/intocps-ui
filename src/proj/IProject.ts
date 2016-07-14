///<reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
///<reference path="../../typings/browser/ambient/node/index.d.ts"/>

import {ProjectSettings} from "./ProjectSettings"

export interface IProject {
    getName(): string;
    getRootFilePath(): string;
    getProjectConfigFilePath(): string;
    getFmusPath(): string;
    getSysMlFolderName(): string;
    save():void;

    createMultiModel(name: string, jsonContent: string): string;
    createDse(name: string, jsonContent: string): string;
    createCoSimConfig(multimodelConfigPath: string, name: string, jsonContent: string): string;

    getSettings(): ProjectSettings;
}
