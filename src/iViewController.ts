export interface IViewController {
    new (protected viewDiv: HTMLDivElement, ...args: any[]);
    initialize?(): void;
    deInitialize?(): boolean;
}
