
import { IntoCpsApp } from "./IntoCpsApp";
import * as fs from 'fs';
import * as Path from 'path';

export function getHtml(markdownFilePath: string): string {
    var showdown = require('showdown'),
        converter = new showdown.Converter()

    //let markdownFilePath = Path.join(IntoCpsApp.getInstance().getActiveProject().getRootFilePath(), "Readme.md");
    if (fs.existsSync(markdownFilePath)) {
        var text = "" + fs.readFileSync(markdownFilePath);
        text = text.split("](").join("](" + IntoCpsApp.getInstance().getActiveProject().getRootFilePath() + "/")
        let html = converter.makeHtml(text);

        return html;
    }
    return null;
}