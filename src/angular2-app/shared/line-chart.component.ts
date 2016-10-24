import { OnInit, Component, ViewChild, ElementRef, Input } from "@angular/core";
import { BehaviorSubject } from "rxjs/Rx";

declare let Plotly: any;

@Component({
    selector: 'line-chart',
    template: ''
})
export class LineChartComponent implements OnInit {
    private loading: boolean = true;
    private redrawCooldown: boolean = false;

    private layout = {
        legend: {
            orientation: "v",
            x: 0,
            y: -0.1,
            xanchor: "left",
            yanchor: "top",

            tracegroupgap: 20
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

    constructor(private element: ElementRef) {

    }

    @Input()
    set datasets(datasets: BehaviorSubject<any>) {
        datasets.subscribe(datasets => this.redraw(datasets));
    }

    ngOnInit() {
        let node = Plotly.d3
            .select(this.element.nativeElement)
            .style({
                width: '100%',
                height: '80vh',
                display: 'block'
            })
            .node();

        Plotly
            .newPlot(node, [], this.layout, this.options)
            .then(() => this.loading = false);

        window.addEventListener('resize', e => Plotly.Plots.resize(node));
    }

    private redraw(datasets: Array<any>) {
        if (this.loading) return;

        // Throttle redrawing to ~60 fps.
        if (this.redrawCooldown === false) {
            this.redrawCooldown = true;

            this.element.nativeElement.data = datasets;

            requestAnimationFrame(() => {
                Plotly.redraw(this.element.nativeElement);
                this.redrawCooldown = false;
            });
        }
    }
}