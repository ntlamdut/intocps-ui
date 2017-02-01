import * as TraceProtocol from "./trace-protocol"
import * as GitConn from "./git-connection"
import * as Path from 'path';
import { IntoCpsApp } from "./../IntoCpsApp";
import { Utilities } from "../utilities";
import { MultiModelConfig } from "./../intocps-configurations/MultiModelConfig";
import { Fmu } from "./../angular2-app/coe/models/Fmu";
export class TraceMessager {
    private static appInstance = IntoCpsApp.getInstance();

    private static getUriRelativeToProjectRoot(path: string){
        return Utilities.pathToUri(Path.relative(this.appInstance.getActiveProject().getRootFilePath(), path))
    }

    private static finishTrace(filePath:string, object: Object){
        console.log("trace: " + JSON.stringify(object));
        this.appInstance.recordTrace(object);
        GitConn.GitCommands.commitFile(filePath);
    }

    public static submitSysMLToMultiModelMessage(mmPath: string, sysmlPath: string): any {
        let project = this.appInstance.getActiveProject();
        var rootMessage = new TraceProtocol.RootMessage();
        var activity = new TraceProtocol.Activity();
        var ef = new TraceProtocol.EntityFile();
        var et = new TraceProtocol.EntityTool();
        var ea = new TraceProtocol.EntityAgent();
        var efDerived = new TraceProtocol.EntityFile();

        rootMessage.activity = activity;
        rootMessage.entities.push(ef);
        rootMessage.agents.push(ea);

        activity.type = "configuration"
        activity.used.push(et);
        activity.used.push(efDerived);
        activity.wasAssociatedWith = ea;
        activity.calcAndSetAbout();

        efDerived.setPropertiesCalcAbout({
            hash: GitConn.GitCommands.getHashOfFile(sysmlPath),
            type: "configuration",
            path: this.getUriRelativeToProjectRoot(sysmlPath)
        });


        ef.setPropertiesCalcAbout({
            hash: GitConn.GitCommands.getHashOfFile(mmPath),
            path: this.getUriRelativeToProjectRoot(mmPath),
            type: "configuration",
            wasGeneratedBy: activity,
            wasAttributedTo: ea,
            wasDerivedFrom: efDerived,
            comment: "Derived multi model configuration from SysML configuration"
        });
        let serializedMessage = rootMessage.serialize();
        this.finishTrace(mmPath, serializedMessage);

        return serializedMessage;
    }

    public static submitEditMultiModelMessage(mmConfig: MultiModelConfig, prevMmHash: string) {
        let project = this.appInstance.getActiveProject();
        var rootMessage = new TraceProtocol.RootMessage();
        var activity = new TraceProtocol.Activity();
        var ef = new TraceProtocol.EntityFile();
        var et = new TraceProtocol.EntityTool();
        var ea = new TraceProtocol.EntityAgent();
        var oldMm = new TraceProtocol.EntityFile();

        mmConfig.fmus.forEach((fmu: Fmu) => {
            let efFmu = new TraceProtocol.EntityFile()
            efFmu.setPropertiesCalcAbout({
                hash: GitConn.GitCommands.getHashOfFile(fmu.path),
                type: "source",
                path: this.getUriRelativeToProjectRoot(fmu.path)
            });
            efFmu.calcAbout();
            activity.used.push(efFmu);
        });

        rootMessage.activity = activity;
        rootMessage.entities.push(ef);
        rootMessage.agents.push(ea);

        activity.type = "configuration"
        activity.used.push(et);
        activity.used.push(oldMm);
        activity.wasAssociatedWith = ea;
        activity.calcAndSetAbout();

        oldMm.setPropertiesCalcAbout({
            hash: prevMmHash,
            type: "configuration",
            path: this.getUriRelativeToProjectRoot(mmConfig.sourcePath)
        });

        ef.setPropertiesCalcAbout({
            hash: GitConn.GitCommands.getHashOfFile(mmConfig.sourcePath),
            path: this.getUriRelativeToProjectRoot(mmConfig.sourcePath),
            type: "configuration",
            wasGeneratedBy: activity,
            wasAttributedTo: ea,
            wasDerivedFrom: oldMm,
            comment: "Edited multi model configuration"
        });

        let serializedMessage = rootMessage.serialize();
        this.finishTrace(mmConfig.sourcePath, serializedMessage);

        return serializedMessage;
    }


    public static submitCoeConfigMessage(mmPath: string, coePath: string)
    {
         let project = this.appInstance.getActiveProject();
        var rootMessage = new TraceProtocol.RootMessage();
        var activity = new TraceProtocol.Activity();
        var ef = new TraceProtocol.EntityFile();
        var et = new TraceProtocol.EntityTool();
        var ea = new TraceProtocol.EntityAgent();
        var efUsed = new TraceProtocol.EntityFile();

        rootMessage.activity = activity;
        rootMessage.entities.push(ef);
        rootMessage.agents.push(ea);

        activity.type = "configuration"
        activity.used.push(et);
        activity.used.push(efUsed);
        activity.wasAssociatedWith = ea;
        activity.calcAndSetAbout();

        efUsed.setPropertiesCalcAbout({
            hash: GitConn.GitCommands.getHashOfFile(mmPath),
            type: "configuration",
            path: this.getUriRelativeToProjectRoot(mmPath)
        });


        ef.setPropertiesCalcAbout({
            hash: GitConn.GitCommands.getHashOfFile(coePath),
            path: this.getUriRelativeToProjectRoot(coePath),
            type: "configuration",
            wasGeneratedBy: activity,
            wasAttributedTo: ea,
            comment: "Derived multi model configuration from SysML configuration"
        });
        let serializedMessage = rootMessage.serialize();
        this.finishTrace(coePath, serializedMessage);

        return serializedMessage;
    }
    

    public static submitSimulationResultMessage(coePath: string, mmPath: string, generatedFiles: string[]){
      let project = this.appInstance.getActiveProject();
        var rootMessage = new TraceProtocol.RootMessage();
        var activity = new TraceProtocol.Activity();
        var ef = new TraceProtocol.EntityFile();
        var et = new TraceProtocol.EntityTool();
        var ea = new TraceProtocol.EntityAgent();
        let usedMM = new TraceProtocol.EntityFile();
        

        rootMessage.activity = activity;
        rootMessage.agents.push(ea);

        activity.type = "simulation"
        activity.used.push(et);
        activity.used.push(ef);
        activity.used.push(usedMM);
        activity.wasAssociatedWith = ea;
        activity.calcAndSetAbout();

        
        //rootMessage:activity:used
        ef.setPropertiesCalcAbout({
            hash: GitConn.GitCommands.getHashOfFile(coePath),
            path: this.getUriRelativeToProjectRoot(coePath),
            type: "configuration"
        });

        usedMM.setPropertiesCalcAbout({
            hash: GitConn.GitCommands.getHashOfFile(mmPath),
            path: this.getUriRelativeToProjectRoot(mmPath),
            type: "configuration"
        });

        //rootMessage:entities
        generatedFiles.forEach((path: string) => {
            let resultEf = new TraceProtocol.EntityFile()
            resultEf.setPropertiesCalcAbout({
                hash: GitConn.GitCommands.getHashOfFile(path),
                type: "result",
                path: this.getUriRelativeToProjectRoot(path),
                wasGeneratedBy: activity,
                wasAttributedTo: ea
            });
            rootMessage.entities.push(resultEf)
        });


        let serializedMessage = rootMessage.serialize();
        //TODO-CTTK:
        this.finishTrace(coePath, serializedMessage);

        return serializedMessage;
    }

}