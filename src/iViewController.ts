export interface IViewController {
    initialize?(): void;
    deInitialize?(): boolean;
}

export abstract class ViewController implements IViewController {
    constructor(protected viewDiv: HTMLDivElement) {};
}
