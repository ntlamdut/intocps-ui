import {IntoCpsApp} from "../IntoCpsApp"
import {SourceDom} from "../sourceDom"
import {ViewController} from "../iViewController"

export class DseController extends ViewController {

    private doNotPressButton: HTMLButtonElement;

    public initialize() {
        IntoCpsApp.setTopName("Design Stace Exploration");
    }

    constructor(div:HTMLDivElement){
      super(div);
    }

    public load(source:SourceDom){
      // process configuration source here
      // as a first step, we recommend extracting the JSON data into a
      // type-safe map
      //var divProgress = <HTMLInputElement>document.getElementById("blah");
      //divProgress.innerText = "Coming even sooner than you think";
    }

    public doAThing(){
        var blah = <HTMLInputElement>document.getElementById("blah");
        //blah.innerText = "Blah";
        var blahStatus = document.createElement("div");
        blahStatus.className = "alert alert-success";
        blahStatus.innerHTML = "Blah blah";
        blah.appendChild(blahStatus);       
    }

    public testChildProcess(){
      var spawn = require('child_process').spawn;  
      var child = spawn("python", ["C:\\Users\\ken\\Downloads\\pwd.py"], {
            detached: true,
            shell: false,
            // cwd: childCwd
      });
      child.unref();

      child.stdout.on('data', function (data: any) {
          console.log('stdout: ' + data);
          //Here is where the output goes
          var blah = <HTMLInputElement>document.getElementById("blah");
          let m = document.createElement("span");
          m.innerText = data + "";
          blah.appendChild(m);          
      });
      child.stderr.on('data', function (data: any) {
          console.log('stderr: ' + data);
          //Here is where the error output goes
      });
      //child.on('close', function (code: any) {
      //    console.log('closing code: ' + code);
      //    //Here you can get the exit code of the script
      //});

      child.stderr.on('data', function (data: any) {
          console.log('stdout: ' + data);
          // here is where the output goes
          var blah = <HTMLInputElement>document.getElementById("blah");
          let m = document.createElement("span");
          m.innerText = data + "";
          blah.appendChild(m);
      }); 
  }
}
