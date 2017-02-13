export class ProjectSettings {

    private owner: any;

    constructor(obj: any) {
        this.owner = obj;
    }

    setValue(key: string, value: any) {
        this.owner[key] = value;
    }


    getValue(key: string): any {
        return this.owner[key];
    }


}
