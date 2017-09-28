import { AppComponent } from './app.component';
import { bootstrap } from '@angular/platform-browser-dynamic';  
import {enableProdMode} from "@angular/core"

function getParameterByName(name:string, url?:string) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
// Start Angular 2 application
enableProdMode();
let ref = bootstrap(AppComponent, []).then((ref) => {
    let data = getParameterByName("data");
    let instance : AppComponent = ref.instance;
    instance.initializeGraph(data);        
});
window.onload = function () {
    console.log("onload");
}