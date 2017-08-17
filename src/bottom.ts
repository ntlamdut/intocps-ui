export class PreviewHandler {

    setVisible: any;
    constructor(setVisible: any) {
        this.setVisible = setVisible;
    }
    public setVisibilityPreviewPanel(name: string, visibel: boolean) {
        this.setVisible("preview", name, visibel);

        var panel = (<HTMLDivElement>document.getElementById(name));
        var children = panel.parentElement.children;
        for (var i = 0; i < children.length; i++) {
            var tableChild = <HTMLDivElement>children[i];
            tableChild.style.display = "none";
        }
        panel.style.display = "block";
    }
}


export class StatusBarHandler {

    static setVisibilityPreviewPanel(element: HTMLElement, previewHandler: PreviewHandler, name: string) {
        if (element.classList.contains("selected")) {
            previewHandler.setVisibilityPreviewPanel(name, false);
            element.classList.remove("selected");

        } else {
            previewHandler.setVisibilityPreviewPanel(name, true);
            element.classList.add("selected");
        }

        var children = element.parentElement.parentElement.getElementsByTagName("a");
        for (var i = 0; i < children.length; i++) {
            var tableChild = <HTMLElement>children[i];
            if (tableChild != element)
                tableChild.classList.remove("selected");
        }
    }

    public static initializeStatusbar(previewHandler: PreviewHandler) {
        $('#navigation').children().on('click', function (event) {
            if (event.target != this) {
                if (event.target.id == "coe-status-btn-status") {
                    StatusBarHandler.setVisibilityPreviewPanel(<HTMLElement>event.target, previewHandler, "coe-status-view");

                } else if (event.target.id == "coe-log-btn-status") {
                    StatusBarHandler.setVisibilityPreviewPanel(<HTMLElement>event.target, previewHandler, "coe-log-view");

                } else if (event.target.id == "trace-daemon-btn-status") {
                    StatusBarHandler.setVisibilityPreviewPanel(<HTMLElement>event.target, previewHandler, "trace-daemon-btn-status");
                }
            }
        });
    };
}