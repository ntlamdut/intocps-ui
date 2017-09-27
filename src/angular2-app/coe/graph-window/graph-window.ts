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

function getParameterByName(name:string, url?:string) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

window.onload = function () {
    
    let data = getParameterByName("data");
    console.log("Data passed: " + data);
    // Start Angular 2 application
    let ref = bootstrap(AppComponent, []).then((ref) => {
        let instance : AppComponent = ref.instance;
        instance.initializeGraph(data);        
    });
}