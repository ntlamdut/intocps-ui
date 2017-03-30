import { DseConfiguration,DseParameterConstraint, DseScenario, DseObjectiveConstraint,IDseObjective, ObjectiveParam, ExternalScript, IDseAlgorithm, DseParameter, IDseRanking, ParetoRanking, GeneticSearch, ExhaustiveSearch} from "./dse-configuration"
export class DseParser{
    protected SEARCH_ALGORITHM_TAG: string = "algorithm"
    protected SEARCH_ALGORITHM_TYPE:string = "type"
    protected SEARCH_ALGORITHM_GENETIC:string="genetic"
    protected SEARCH_ALGORITHM_EXHAUSTIVE:string="exhaustive"
    
    protected OBJECTIVE_CONSTRAINT_TAG: string = "objectiveConstraints"
    protected OBJECTIVES_TAG: string = "objectiveDefinitions"
    protected EXTERNAL_SCRIPT_TAG: string = "externalScripts"
    protected EXTERNAL_SCRIPT_FILE_TAG: string = "scriptFile"
    protected EXTERNAL_SCRIPT_PARAMS_TAG: string = "scriptParameters"
    protected INTERNAL_FUNCTION_TAG: string = "internalFunctions"

    protected PARAMETER_CONSTRAINT_TAG: string = "parameterConstraints"
    protected PARAMETERS_TAG: string = "parameters"
   
    protected RANKING_TAG: string = "ranking"
    protected RANKING_PARETO_TAG: string = "pareto"

    protected SCENARIOS_TAG: string = "scenarios"
    
    parseSearchAlgorithm(data: any, dse:DseConfiguration) {
        let algorithm = data[this.SEARCH_ALGORITHM_TAG]
        if(!algorithm) {
            let al = new ExhaustiveSearch();
            dse.newSearchAlgortihm(al);
            return;
        };
        let type = algorithm[this.SEARCH_ALGORITHM_TYPE]
        if(type === this.SEARCH_ALGORITHM_GENETIC){
            let al = this.parseSearchAlgorithmGenetic(algorithm);
            dse.newSearchAlgortihm(al);
        }
        else if (type=== this.SEARCH_ALGORITHM_EXHAUSTIVE){
            let al = new ExhaustiveSearch();
            dse.newSearchAlgortihm(al);
        }
    }

    private parseSearchAlgorithmGenetic(algorithm: any) : IDseAlgorithm
    {
        let initialPopulation : number = parseFloat(algorithm["initialPopulation"]);
        let randomBalanced : string = algorithm["randomBalanced"];
        let terminationRounds : number = parseFloat(algorithm["terminationRounds"]);
        return new GeneticSearch(initialPopulation, randomBalanced, terminationRounds)
    }

    parseObjectiveConstraint(data: any, dse:DseConfiguration) {
        let objConst = data[this.OBJECTIVE_CONSTRAINT_TAG];
        let objConstList : DseObjectiveConstraint[] = [];
        objConst.forEach(function(value:string) {
            let newParamConstraint = new DseObjectiveConstraint(value);
            objConstList.push(newParamConstraint);
        })
        dse.newObjectiveConstraint(objConstList);
    }

    parseParameterConstraints(data: any, dse:DseConfiguration) {
        let paramConst = data[this.PARAMETER_CONSTRAINT_TAG];
        let paramConstList : DseParameterConstraint[] = [];
        paramConst.forEach(function(value:string) {
            let newParamConstraint = new DseParameterConstraint(value);
            paramConstList.push(newParamConstraint);
        })
        dse.newParameterConstraint(paramConstList);
    }

     //FULL VERSION NEEDS KNOWLEDGE OF MULTI-MODEL IN USE
     //Utility method to obtain an instance from the multimodel by its string id encoding
    private getParameter(dse: DseConfiguration, id: string): DseParameter {
       // let ids = this.parseId(id);

       // let fmuName = ids[0];
        //let instanceName = ids[1];
        //let scalarVariableName = ids[2];
        return dse.getParameterOrCreate(id);
    }

    parseParameters(data: any, dse:DseConfiguration){
        if (Object.keys(data).indexOf(this.PARAMETERS_TAG) >= 0) {
            let parameterData = data[this.PARAMETERS_TAG];
            $.each(Object.keys(parameterData), (j, id) => {
                let values = parameterData[id];

                let ids = this.parseId(id);

                let fmuName = ids[0];
                let instanceName = ids[1];
                let scalarVariableName = ids[2];

                //FULL VERSION NEEDS KNOWLEDGE OF MULTI-MODEL IN USE
                var param = this.getParameter(dse, id);
                Array.prototype.push.apply(param.initialValues, values);
            });
        }
    }


    parseExtScrObjectives(data: any, dse:DseConfiguration){
        if (Object.keys(data).indexOf(this.OBJECTIVES_TAG) >= 0) {
            let objData = data[this.OBJECTIVES_TAG];
            $.each(Object.keys(objData), (j, id) => {
                if (id == this.EXTERNAL_SCRIPT_TAG){
                    this.parseExternalScript(objData[id], dse);
                }
            });
        }
    }

    private parseExternalScript(data: any, dse:DseConfiguration){
        $.each(Object.keys(data), (j, id) => {
            let objEntries = data[id];
            //GET SCRIPT NAME
            let extName = objEntries[this.EXTERNAL_SCRIPT_FILE_TAG];
            let paramList = objEntries[this.EXTERNAL_SCRIPT_PARAMS_TAG];
            let objParams : ObjectiveParam [] = [];
            //GET SCRIPT PARAMETERS
            $.each(Object.keys(paramList), (j, id2) => {
                let pName = paramList[id2];
                let newParam = new ObjectiveParam(id2, pName);
                objParams.push(newParam);
            });
            dse.newExternalScript(id, extName, objParams);

                //FULL VERSION NEEDS KNOWLEDGE OF MULTI-MODEL IN USE
                //var param = this.getParameter(dse, id);
               // Array.prototype.push.apply(param.initialValues, values);
            });
    }


    parseIntFuncsObjectives(data: any, dse:DseConfiguration){
        if (Object.keys(data).indexOf(this.OBJECTIVES_TAG) >= 0) {
            let objData = data[this.OBJECTIVES_TAG];
            $.each(Object.keys(objData), (j, id) => {
                if (id == this.INTERNAL_FUNCTION_TAG){
                    this.parseInternalFunction(objData[id], dse);
                }
            });
        }
    }


    private parseInternalFunction(data: any, dse:DseConfiguration){//To add
    }

    parseRanking(data: any, dse:DseConfiguration){
        let ranking = data[this.RANKING_TAG];
        let ranktype = ranking[this.RANKING_PARETO_TAG]
        if(ranktype) dse.newRanking(this.parseParetoRanking(ranktype));
        //check other rank types as added
    }

    private parseParetoRanking(data:any) : IDseRanking{
        let paretoDimension: Map<String, any> = new Map<String, any>();
        $.each(Object.keys(data), (j, id) => {
            let value = data[id];
            paretoDimension.set(id, value)
        });
        
        return new ParetoRanking(paretoDimension);
    }


    parseScenarios(data: any, dse:DseConfiguration) {
        let scenarios = data[this.SCENARIOS_TAG];
        let scenarioList : DseScenario[] = [];
        scenarios.forEach(function(value:string) {
            let newParamConstraint = new DseScenario(value);
            scenarioList.push(newParamConstraint);
        })
        dse.newScenario(scenarioList);
    }

    parseSimpleTag(data: any, tag: string): any {
        return data[tag] !== undefined ? data[tag] : null;
    }

    parseId(id: string): string[] {
        //is must have the form: '{' + fmuName '}' + '.' instance-name + '.' + scalar-variable
        // restriction is that instance-name cannot have '.'

        let indexEndCurlyBracket = id.indexOf('}');
        if (indexEndCurlyBracket <= 0) {
            throw "Invalid id";
        }

        let fmuName = id.substring(0, indexEndCurlyBracket + 1);
        var rest = id.substring(indexEndCurlyBracket + 1);
        var dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after fmu name";
        }
        rest = rest.substring(dotIndex + 1);
        //this is instance-name start index 0

        dotIndex = rest.indexOf('.');
        if (dotIndex < 0) {
            throw "Missing dot after instance name";
        }
        let instanceName = rest.substring(0, dotIndex);
        let scalarVariableName = rest.substring(dotIndex + 1);

        return [fmuName, instanceName, scalarVariableName];
    }

}