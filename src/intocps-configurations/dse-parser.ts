import {IDseAlgorithm, GeneticSearch, ExhaustiveSearch} from "./dse-configuration"
export class DseParser{
    protected SEARCH_ALGORITHM_TAG: string = "searchAlgorithm"
    protected SEARCH_ALGORITHM_TYPE:string = "type"
    protected SEARCH_ALGORITHM_GENETIC:string="genetic"
    protected SEARCH_ALGORITHM_EXHAUSTIVE:string="exhaustive"
    parseSearchAlgorithm(data: any) : IDseAlgorithm {
        let algorithm = data[this.SEARCH_ALGORITHM_TAG]
        if(!algorithm) return;
        let type = algorithm[this.SEARCH_ALGORITHM_TYPE]
        if(type === this.SEARCH_ALGORITHM_GENETIC)
            return this.parseSearchAlgorithmGenetic(algorithm)
        else if (type=== this.SEARCH_ALGORITHM_EXHAUSTIVE)
            return new ExhaustiveSearch();
    }
    private parseSearchAlgorithmGenetic(algorithm: any) : IDseAlgorithm
    {
        let initialPopulation : number = parseFloat(algorithm["initialPopulation"]);
        let randomBalanced : string = algorithm["randomBalanced"];
        let terminationRounds : number = parseFloat(algorithm["terminationRounds"]);
        return new GeneticSearch(initialPopulation, randomBalanced, terminationRounds)
    }
}