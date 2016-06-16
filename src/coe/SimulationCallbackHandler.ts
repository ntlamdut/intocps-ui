/// <reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
/// <reference path="../../typings/browser/ambient/node/index.d.ts"/>
/// <reference path="../../typings/browser/ambient/jquery/index.d.ts"/>
/// <reference path="../../node_modules/typescript/lib/lib.es6.d.ts" />

declare var Plotly:any;

import * as Main from  "../settings/settings"
import * as IntoCpsApp from  "../IntoCpsApp"
import {IntoCpsAppEvents} from "../IntoCpsAppEvents";
import * as Collections from 'typescript-collections';
import {CoeConfig} from './CoeConfig'

export class SimulationCallbackHandler {
    private redrawCooldown:boolean = false;
    public chart: any;
    public chartIds: string[] = [];
    connect(url: string) {

        var websocket = new WebSocket(url);
        let _this = this;
        websocket.onopen = function (evt) { _this.onOpen(evt) };
        websocket.onclose = function (evt) { _this.onClose(evt) };
        websocket.onmessage = function (evt) { _this.onMessage(evt) };
        websocket.onerror = function (evt) { _this.onError(evt) };


        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = '.string { color: green; } .number { color: darkorange; } .boolean { color: blue; } .null { color: magenta; } .key { color: red; } ';
        document.getElementsByTagName('head')[0].appendChild(style);
    }

    onOpen(evt: any) {
        // Callback output text
        // this.output("CONNECTED");
    }

    onClose(evt: any) {
        // Callback output text
        // this.output('<span style="color: orange;">CLOSE: </span> ')
        // this.output("DISCONNECTED");
    }

    onMessage(evt: any) {
        var jsonData = JSON.parse(evt.data);

        // Callback output text
        // var str = JSON.stringify(jsonData, undefined, 4);
        // this.output(this.syntaxHighlight(str));

        //calculate id

        $.each(Object.keys(jsonData), (i, fmuKey) => {
            if (fmuKey.indexOf("{") !== 0) return;

            $.each(Object.keys(jsonData[fmuKey]), (j, instanceKey) => {
                $.each(Object.keys(jsonData[fmuKey][instanceKey]), (k, outputKey) => {
                    var value = jsonData[fmuKey][instanceKey][outputKey];

                    $.each(this.chartIds, (index, datasetKey) => {
                        if (datasetKey !== fmuKey + "." + instanceKey + "." + outputKey) return;

                        if (value == "true") value = 1;
                        else if (value == "false") value = 0;

                        this.chart.data[index].y.push(value);

                        // Throttle redrawing to ~60 fps.
                        if (this.redrawCooldown === false) {
                            this.redrawCooldown = true;

                            requestAnimationFrame(() => {
                                Plotly.redraw(this.chart);
                                this.redrawCooldown = false;
                            });
                        }
                    });
                });
            });
        });
    }

    onError(evt: any) {
        // Callback output text
        // this.output('<span style="color: red;">ERROR:</span> ' + evt.data);
    }

// Callback output text
    // output(inp: string) {

    //     let div = <HTMLInputElement>document.getElementById("coe-callback");

    //     let pre = document.createElement('pre');

    //     /* pre {outline: 1px solid #ccc; padding: 5px; margin: 5px; }
    // .string { color: green; }
    // .number { color: darkorange; }
    // .boolean { color: blue; }
    // .null { color: magenta; }
    // .key { color: red; } */
    //     pre.style.outline = "1px solid #ccc";
    //     pre.style.padding = "5px";
    //     pre.style.margin = "5px";


    //     pre.innerHTML = inp;
    //     div.appendChild(pre);

    //     //document.body.appendChild(document.createElement('pre')).innerHTML = inp;
    // }

    syntaxHighlight(json: string) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            var cls = 'number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'key';
                } else {
                    cls = 'string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'boolean';
            } else if (/null/.test(match)) {
                cls = 'null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
}


