import { OnInit, Component, Input, NgZone, Output } from "@angular/core";
import { Serializer } from "../../intocps-configurations/Parser";
import { OutputConnectionsPair } from "../coe/models/Fmu";
import IntoCpsApp from "../../IntoCpsApp";
import { FORM_DIRECTIVES, REACTIVE_FORM_DIRECTIVES, Validators, FormArray, FormControl, FormGroup } from "@angular/forms";
import {
    IDseAlgorithm, GeneticSearch, ExhaustiveSearch, DseConfiguration
} from "../../intocps-configurations/dse-configuration";
import {NavigationService} from "../shared/navigation.service";


@Component({
    selector: "dse-overview",
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES],
    templateUrl: "./angular2-app/dse/dse-overview.component.html"
})
export class DseOverviewComponent {
    private _path: string;
    editing: boolean = false;
    form: FormGroup;
    searchAlgorithms: IDseAlgorithm[] = [];
    searchAlgorithmFormGroups = new Map<IDseAlgorithm, FormGroup>();
    private config: DseConfiguration;

    @Input()
    set path(path: string) {
        this._path = path;
        if (path)
            this.parseConfig()

    }
    get path(): string {
        return this._path;
    }

    private searchAlgorithmConstructors = [
        GeneticSearch, ExhaustiveSearch
    ]

    constructor(private zone: NgZone, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    private parseConfig() {
        DseConfiguration
            .parse(this.path)
            .then(config => {
                this.zone.run(() => {
                    this.config = config;
                    this.searchAlgorithms = this.searchAlgorithmConstructors
                        .map(constructor =>
                            this.config.searchAlgorithm instanceof constructor
                                ? this.config.searchAlgorithm
                                : new constructor()
                        );

                    // Create an array of formGroups for the algorithms
                    this.searchAlgorithms.forEach(algorithm => {
                        this.searchAlgorithmFormGroups.set(algorithm, algorithm.toFormGroup());
                    });

                    // Create a form group for validation
                    this.form = new FormGroup({
                        searchAlgorithm: this.searchAlgorithmFormGroups.get(this.config.searchAlgorithm)
                    }, null, null);
                })
            }, error => alert(error));
    }

    onAlgorithmChange(algorithm: IDseAlgorithm) {
        this.config.searchAlgorithm = algorithm;

        this.form.removeControl('searchAlgorithm');
        this.form.addControl('searchAlgorithm', this.searchAlgorithmFormGroups.get(algorithm));
    }

    onSubmit(){
        if(!this.editing) return;
        this.config.save();
        this.editing = false;
    }

    onNavigate(): boolean {
        if (!this.editing)
            return true;

        if (this.form.valid) {
            if (confirm("Save your work before leaving?"))
                this.onSubmit();

            return true;
        } else {
            return confirm("The changes to the configuration are invalid and can not be saved. Continue anyway?");
        }
    }

}