export class DropDownNonLoad {
    private values: Array<string> = [];
    private selectionChanged: (selected: string, dropDown?: DropDownNonLoad) => void

    private dropDownValuesUI: HTMLUListElement;

    private nameUI: HTMLSpanElement;

    private container: HTMLElement;

    changedCallback: (dropDown: DropDownNonLoad) => void;

    constructor(container:HTMLElement, values: Array<string>, name?: string) {
        this.container = container;
        this.values = values;
        this.initializeUI(name);
    }

    private initializeUI(name?: string) {
        this.nameUI = <HTMLSpanElement>this.container.querySelector("#name");
        this.dropDownValuesUI = <HTMLUListElement>this.container.querySelector("#ulist");
        if(name != null)
        {
            this.setName(name);
        }
        this.updateValues(this.values);
    }

    private getLIText(element: HTMLLinkElement) {
        return element.textContent;
    }

    // Removes all LI elements
    private clearList() {
        while (this.dropDownValuesUI.hasChildNodes()) {
            this.dropDownValuesUI.removeChild(this.dropDownValuesUI.lastChild);
        }
    }

    // Clears the list and adds LI element for each value except the selected value
    updateValues(values: Array<string>) {
        this.clearList();
        this.values = values;
        let generateHtml = (value: string) => {
            return "<li><a href='#' id='value'>" + value + "</a></li>";
        };

        let range = document.createRange();
        range.selectNode(this.dropDownValuesUI);
        values.forEach(element => {
            if (this.nameUI.textContent != element) {
                let docFrag: HTMLLIElement = <HTMLLIElement>range.createContextualFragment(generateHtml(element));
                (<HTMLLIElement>docFrag.lastChild).onclick = this.elementClicked.bind(this);
                this.dropDownValuesUI.appendChild(docFrag.lastChild);
            }
        });
    }

    private setName(value: string) {
        this.nameUI.textContent = value;
    }

    private elementClicked(event: MouseEvent) {
        let previousName = this.getSelected();
        let name: string = this.getLIText(<HTMLLinkElement>event.target);
        this.setName(name);
        this.values.splice(this.values.indexOf(name),1);
        this.values.push(previousName);
        this.updateValues(this.values);
        this.selectionChanged(name,this);
    }

    getSelected() {
        return this.nameUI.textContent;
    }

    getContainer() {
        return this.container;
    }

    setSelectionChangedHandler(changedHandler: (selected: string, dropDown?: DropDownNonLoad) => void) {
        this.selectionChanged = changedHandler;
    }

    listChanged(values: Array<string>) {
        this.clearList();
        this.updateValues(values);
    }
}