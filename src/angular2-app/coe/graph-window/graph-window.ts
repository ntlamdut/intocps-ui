import { AppComponent } from './app.component';
import { bootstrap } from '@angular/platform-browser-dynamic';  

function gup(name: any, url: any) {
    if (!url) url = location.href;
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(url);
    return results == null ? null : results[1];
}

window.onload = function () {
    let websocket = decodeURIComponent(gup("data", undefined));
    console.log("Websocket passed");
    // Start Angular 2 application
    let ref = bootstrap(AppComponent, []).then((ref) => {
        let instance : AppComponent = ref.instance;
    });
}