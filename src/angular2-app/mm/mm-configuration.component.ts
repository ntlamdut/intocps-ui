import { Component, Input, NgZone, Output, EventEmitter } from "@angular/core";
import { MultiModelConfig } from "../../intocps-configurations/MultiModelConfig";
import IntoCpsApp from "../../IntoCpsApp";
import {
    Instance, ScalarVariable, CausalityType, InstanceScalarPair, isCausalityCompatible, isTypeCompatiple,
    Fmu, ScalarValuePair, ScalarVariableType
} from "../coe/models/Fmu";
import { FileBrowserComponent } from "./inputs/file-browser.component";
import { IProject } from "../../proj/IProject";
import { FormGroup, REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, FormArray, FormControl, Validators } from "@angular/forms";
import { uniqueControlValidator } from "../shared/validators";
import { NavigationService } from "../shared/navigation.service";
import { WarningMessage } from "../../intocps-configurations/Messages";

import * as Path from 'path';

@Component({
    selector: "mm-configuration",
    templateUrl: "./angular2-app/mm/mm-configuration.component.html",
    directives: [
        FORM_DIRECTIVES,
        REACTIVE_FORM_DIRECTIVES,
        FileBrowserComponent
    ]
})
export class MmConfigurationComponent {
    private _path: string;

    @Input()
    set path(path: string) {
        this._path = path;

        if (path)
            this.parseConfig();
    }
    get path(): string {
        return this._path;
    }

    @Output()
    change = new EventEmitter<string>();

    form: FormGroup;
    editing: boolean = false;
    parseError: string = null;
    warnings: WarningMessage[] = [];

    private config: MultiModelConfig;

    private selectedParameterInstance: Instance;
    private selectedOutputInstance: Instance;
    private selectedOutput: ScalarVariable;
    private selectedInputInstance: Instance;
    private selectedInstanceFmu: Fmu;

    private newParameter: ScalarVariable;

    constructor(private zone: NgZone, private navigationService: NavigationService) {
        this.navigationService.registerComponent(this);
    }

    parseConfig() {
        let project: IProject = IntoCpsApp.getInstance().getActiveProject();

        MultiModelConfig
            .parse(this.path, project.getFmusPath())
            .then(config => {
                this.zone.run(() => {
                    this.parseError = null;

                    this.config = config;

                    // Create a form group for validation
                    this.form = new FormGroup({
                        fmus: new FormArray(this.config.fmus.map(fmu => new FormControl(this.getFmuName(fmu), [Validators.required, Validators.pattern("[^{^}]*")])), uniqueControlValidator),
                        instances: new FormArray(this.config.fmus.map(fmu => new FormArray(this.getInstances(fmu).map(instance => new FormControl(instance.name, [Validators.required, Validators.pattern("[^\.]*")])), uniqueControlValidator)))
                    });
                });
            }, error => this.zone.run(() => this.parseError = error));
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

    loadDiagram() {
        if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
    var $ = go.GraphObject.make;

    var myDiagram =
      $(go.Diagram, "connectionsDiagram",
        {
          initialContentAlignment: go.Spot.Left,
          initialAutoScale: go.Diagram.UniformToFill,
          layout: $(go.LayeredDigraphLayout,
                    { direction: 0 }),
          "undoManager.isEnabled": true
        }
      );


    function makePort(name, leftside) {
      var port = $(go.Shape, "Rectangle",
                   {
                     fill: "gray", stroke: null,
                     desiredSize: new go.Size(8, 8),
                     portId: name,  // declare this object to be a "port"
                     toMaxLinks: 1,  // don't allow more than one link into a port
                     cursor: "pointer"  // show a different cursor to indicate potential link point
                   });

      var lab = $(go.TextBlock, name,  // the name of the port
                  { font: "7pt sans-serif" });

      var panel = $(go.Panel, "Horizontal",
                    { margin: new go.Margin(2, 0) });

      // set up the port/panel based on which side of the node it will be on
      if (leftside) {
        port.toSpot = go.Spot.Left;
        port.toLinkable = true;
        lab.margin = new go.Margin(1, 0, 0, 1);
        panel.alignment = go.Spot.TopLeft;
        panel.add(port);
        panel.add(lab);
      } else {
        port.fromSpot = go.Spot.Right;
        port.fromLinkable = true;
        lab.margin = new go.Margin(1, 1, 0, 0);
        panel.alignment = go.Spot.TopRight;
        panel.add(lab);
        panel.add(port);
      }
      return panel;
    }

    function makeTemplate(typename, icon, background, inports, outports) {
      var node = $(go.Node, "Spot",
          $(go.Panel, "Auto",
            { width: 100, height: 120 },
            $(go.Shape, "Rectangle",
              {
                fill: background, stroke: null, strokeWidth: 0,
                spot1: go.Spot.TopLeft, spot2: go.Spot.BottomRight
              }),
            $(go.Panel, "Table",
              $(go.TextBlock, typename,
                {
                  row: 0,
                  margin: 3,
                  maxSize: new go.Size(80, NaN),
                  stroke: "white",
                  font: "bold 11pt sans-serif"
                }),
              $(go.Picture, icon,
                { row: 1, width: 55, height: 55 }),
              $(go.TextBlock,
                {
                  row: 2,
                  margin: 3,
                  editable: true,
                  maxSize: new go.Size(80, 40),
                  stroke: "white",
                  font: "bold 9pt sans-serif"
                },
                new go.Binding("text", "name").makeTwoWay())
            )
          ),
          $(go.Panel, "Vertical",
            {
              alignment: go.Spot.Left,
              alignmentFocus: new go.Spot(0, 0.5, -8, 0)
            },
            inports),
          $(go.Panel, "Vertical",
            {
              alignment: go.Spot.Right,
              alignmentFocus: new go.Spot(1, 0.5, 8, 0)
            },
            outports)
        );
      myDiagram.nodeTemplateMap.add(typename, node);
    }

    makeTemplate("Table", "images/55x55.png", "forestgreen",
                 [],
                 [makePort("OUT", false)]);

    makeTemplate("Join", "images/55x55.png", "mediumorchid",
                 [makePort("L", true), makePort("R", true)],
                 [makePort("UL", false), makePort("ML", false), makePort("M", false), makePort("MR", false), makePort("UR", false)]);

    makeTemplate("Project", "images/55x55.png", "darkcyan",
                 [makePort("", true)],
                 [makePort("OUT", false)]);

    makeTemplate("Filter", "images/55x55.png", "cornflowerblue",
                 [makePort("", true)],
                 [makePort("OUT", false),makePort("INV", false)]);

    makeTemplate("Group", "images/55x55.png", "mediumpurple",
                 [makePort("", true)],
                 [makePort("OUT", false)]);

    makeTemplate("Sort", "images/55x55.png", "sienna",
                 [makePort("", true)],
                 [makePort("OUT", false)]);

    makeTemplate("Export", "images/55x55.png", "darkred",
                 [makePort("", true)],
                 []);

    myDiagram.linkTemplate =
      $(go.Link,
        {
          routing: go.Link.Orthogonal, corner: 5,
          relinkableFrom: true, relinkableTo: true
        },
        $(go.Shape, { stroke: "gray", strokeWidth: 2 }),
        $(go.Shape, { stroke: "gray", fill: "gray", toArrow: "Standard" })
      );

     myDiagram.model = go.Model.fromJson(document.getElementById("mySavedModel").value);
    }


    onSubmit() {
        if (!this.editing) return;

        this.warnings = this.config.validate();

        if (this.warnings.length > 0) return;

        this.config.save()
            .then(() => {
                this.parseConfig();
                this.selectOutputInstance(null);
                this.selectParameterInstance(null);
                this.change.emit(this.path);
            });

        this.editing = false;
    }

    addFmu() {
        let fmu = this.config.addFmu();

        let formArray = <FormArray>this.form.find('fmus');
        let fmuArray = <FormArray>this.form.find('instances');

        fmuArray.push(new FormArray([], uniqueControlValidator));
        formArray.push(new FormControl(this.getFmuName(fmu), [Validators.required, Validators.pattern("[^{^}]*")]));
    }

    removeFmu(fmu: Fmu) {
        let fmuArray = <FormArray>this.form.find('fmus');
        let index = this.config.fmus.indexOf(fmu);

        if (this.selectedInstanceFmu === fmu)
            this.selectInstanceFmu(null);

        this.config.fmuInstances
            .filter(instance => instance.fmu === fmu)
            .forEach(instance => this.removeInstanceFromForm(instance));

        fmuArray.removeAt(index);
        this.config.removeFmu(fmu);
    }

    getScalarTypeName(type: number) {
        return ['Real', 'Bool', 'Int', 'String', 'Unknown'][type];
    }

    getFmuName(fmu: Fmu): string {
        return fmu.name.substring(1, fmu.name.length - 1);
    }

    setFmuName(fmu: Fmu, name: string) {
        fmu.name = `{${name}}`;
    }

    setFmuPath(fmu: Fmu, path: string) {
        fmu
            .updatePath(path)
            .then(() => this.zone.run(() => { }));

        this.selectOutputInstance(null);
    }

    addInstance(fmu: Fmu) {
        let instance = this.config.addInstance(fmu);

        let fmuIndex = this.config.fmus.indexOf(fmu);
        let fmuArray = <FormArray>this.form.find('instances');
        let instanceArray = <FormArray>fmuArray.controls[fmuIndex];

        instanceArray.push(new FormControl(instance.name, [Validators.required, Validators.pattern("[^\.]*")]));
    }

    removeInstance(instance: Instance) {
        this.removeInstanceFromForm(instance);
        this.config.removeInstance(instance);
    }

    removeInstanceFromForm(instance: Instance) {
        let fmuIndex = this.config.fmus.indexOf(instance.fmu);
        let fmuArray = <FormArray>this.form.find('instances');
        let instanceArray = <FormArray>fmuArray.controls[fmuIndex];
        let index = this.getInstances(instance.fmu).indexOf(instance);

        if (this.selectedInputInstance === instance)
            this.selectInputInstance(null);

        if (this.selectedOutputInstance === instance)
            this.selectOutputInstance(null);

        if (this.selectedParameterInstance === instance)
            this.selectParameterInstance(null);

        instanceArray.removeAt(index);
    }

    getInstances(fmu: Fmu) {
        return this.config.fmuInstances.filter(instance => instance.fmu === fmu);
    }

    getInstanceFormControl(fmu: Fmu, index: number): FormControl {
        let fmuIndex = this.config.fmus.indexOf(fmu);
        let fmuArray = <FormArray>this.form.find('instances');
        let instanceArray = <FormArray>fmuArray.controls[fmuIndex];

        return <FormControl>instanceArray.controls[index];
    }

    selectInstanceFmu(fmu: Fmu) {
        this.selectedInstanceFmu = fmu;
    }

    selectParameterInstance(instance: Instance) {
        this.selectedParameterInstance = instance;
        this.newParameter = this.getParameters()[0];
    }

    selectOutputInstance(instance: Instance) {
        this.selectedOutputInstance = instance;
        this.selectOutput(null);
    }

    selectOutput(variable: ScalarVariable) {
        this.selectedOutput = variable;
        this.selectInputInstance(null);
    }

    selectInputInstance(instance: Instance) {
        this.selectedInputInstance = instance;
    }

    getInitialValues(): Array<ScalarValuePair> {
        let initialValues: Array<ScalarValuePair> = [];

        this.selectedParameterInstance.initialValues.forEach((value, variable) => {
            initialValues.push(new ScalarValuePair(variable, value));
        });

        return initialValues;
    }

    addParameter() {
        if (!this.newParameter) return;

        this.selectedParameterInstance.initialValues.set(this.newParameter, '');
        this.newParameter = this.getParameters()[0];
    }

    setParameter(parameter: ScalarVariable, value: any) {
        if (parameter.type === ScalarVariableType.Real)
            value = parseFloat(value);
        else if (parameter.type === ScalarVariableType.Int)
            value = parseInt(value);
        else if (parameter.type === ScalarVariableType.Bool)
            value = !!value;

        this.selectedParameterInstance.initialValues.set(parameter, value);
    }

    removeParameter(instance: Instance, parameter: ScalarVariable) {
        instance.initialValues.delete(parameter);
        this.newParameter = this.getParameters()[0];
    }

    getParameters() {
        if (!this.selectedParameterInstance)
            return [null];

        return this.selectedParameterInstance.fmu.scalarVariables
            .filter(variable => isCausalityCompatible(variable.causality, CausalityType.Parameter) && !this.selectedParameterInstance.initialValues.has(variable));
    }

    getOutputs() {
        return this.selectedOutputInstance.fmu.scalarVariables
            .filter(variable => isCausalityCompatible(variable.causality, CausalityType.Output));
    }

    getInputs() {
        return this.selectedInputInstance.fmu.scalarVariables
            .filter(variable => isCausalityCompatible(variable.causality, CausalityType.Input) && isTypeCompatiple(variable.type, this.selectedOutput.type));
    }

    isInputConnected(input: ScalarVariable) {
        let pairs = this.selectedOutputInstance.outputsTo.get(this.selectedOutput);

        if (!pairs)
            return false;

        return pairs.filter(pair => pair.instance === this.selectedInputInstance && pair.scalarVariable === input).length > 0;
    }

    onConnectionChange(checked: boolean, input: ScalarVariable) {
        let outputsTo: InstanceScalarPair[] = this.selectedOutputInstance.outputsTo.get(this.selectedOutput);

        if (checked) {
            if (outputsTo == null) {
                outputsTo = [];
                this.selectedOutputInstance.outputsTo.set(this.selectedOutput, outputsTo);
            }
            outputsTo.push(new InstanceScalarPair(this.selectedInputInstance, input));
        } else {
            outputsTo.splice(outputsTo.findIndex(pair => pair.instance === this.selectedInputInstance && pair.scalarVariable === input), 1);

            if (outputsTo.length === 0)
                this.selectedOutputInstance.outputsTo.delete(this.selectedOutput);
        }
    }


    createDisplayFmuPath(fmusRootPath: string, path: string): string {

        if (path.startsWith(fmusRootPath)) {
            return Path.basename(path);
        }
        else {
            return path;
        }
    }
}