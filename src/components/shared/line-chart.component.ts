import {OnInit, Component, ViewChild, ElementRef, Input} from "@angular/core";
import {BehaviorSubject} from "rxjs/Rx";

declare let Plotly:any;

@Component({
    selector: 'line-chart',
    template: '<div #container></div>'
})
export class LineChartComponent implements OnInit {
    private loading:boolean = true;
    private redrawCooldown:boolean = false;

    private layout = {
        legend: {
            orientation: "h"
        },
        xaxis: {
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            showline: false
        }
    };

    private options = {
        displaylogo: false
    };

    @ViewChild('container')
    containerElement:ElementRef;

    @Input()
    set datasets(datasets:BehaviorSubject<any>) {
        datasets.subscribe(datasets => this.redraw(datasets));
    }

    ngOnInit() {
        let node = Plotly.d3
            .select(this.containerElement.nativeElement)
            .style({
                width: '100%',
                height: '80vh'
            })
            .node();

        Plotly
            .newPlot(node, [], this.layout, this.options)
            .then(() => this.loading = false);

        window.addEventListener('resize', e => Plotly.Plots.resize(node));
    }

    private redraw(datasets:Array<any>) {
        if (this.loading) return;

        // Throttle redrawing to ~60 fps.
        if (this.redrawCooldown === false) {
            this.redrawCooldown = true;

            this.containerElement.nativeElement.data = datasets;

            requestAnimationFrame(() => {
                Plotly.redraw(this.containerElement.nativeElement);
                this.redrawCooldown = false;
            });
        }
    }
}