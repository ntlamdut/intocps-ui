import {OnInit, Component, ViewChild, ElementRef, Input} from "@angular/core";

declare var Plotly:any;

@Component({
    selector: 'line-chart',
    template: '<div #container></div>'
})
export class LineChartComponent implements OnInit {
    private loading:boolean = true;
    private redrawCooldown:boolean = false;
    private _datasets:Array<any> = [];

    private layout = {
        xaxis: {
            showgrid: false,
            zeroline: false
        },
        yaxis: {
            showline: false
        }
    };

    @ViewChild('container')
    containerElement:ElementRef;

    @Input()
    set datasets(datasets:Array<any>) {
        this._datasets = datasets;
        this.redraw();
    }
    get datasets() {
        return this._datasets;
    }

    ngOnInit() {
        var node = Plotly.d3
            .select(this.containerElement.nativeElement)
            .style({
                width: '100%',
                height: '80vh'
            })
            .node();

        Plotly
            .newPlot(node, [], this.layout)
            .then(() => this.loading = false);

        window.addEventListener('resize', e => Plotly.Plots.resize(node));
    }

    private redraw() {
        if (this.loading) return;

        this.containerElement.nativeElement.data = this.datasets;

        // Throttle redrawing to ~60 fps.
        if (this.redrawCooldown === false) {
            this.redrawCooldown = true;

            requestAnimationFrame(() => {
                Plotly.redraw(this.containerElement.nativeElement);
                this.redrawCooldown = false;
            });
        }
    }
}