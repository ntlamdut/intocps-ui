
export class Message {
    constructor(public message: string = "") {
    }
}

export class WarningMessage extends Message {

}

export class ErrorMessage extends WarningMessage {

}
