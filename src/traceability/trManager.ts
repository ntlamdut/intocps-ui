
import childProcess = require("child_process");
import { IntoCpsApp } from "../IntoCpsApp"
import { SettingKeys } from "../settings/SettingKeys";
import { Project } from "../proj/Project"
import { Daemon } from "../traceability/daemon"

var fsFinder = require("fs-finder");
var fs = require("fs");
import Path = require("path");


class Neo4Jconfiguration {
    private configurationLocation: string;
    homeLocation: string;
    binariesLocation: string;
    username: string;
    password: string;
    port: string;
    active: boolean;

    constructor(confLoc: string, appDir: string, appsDirTemp: string) {
        this.active = false;
        this.configurationLocation = confLoc;
        this.homeLocation = this.getHomeLocation(appDir, appsDirTemp);
        this.setBinaryLocation();
        this.username = "intoCPSApp";
        this.password = "KLHJiK8k2378HKsg823jKKLJ89sjklJHBNf8j8JH7FxE";
        this.port = "7474";
    }

    public setBinaryLocation() {
        this.binariesLocation = this.homeLocation + Path.sep + "bin";
    }
    public setConfigurationLocation(confLoc: string) {

        this.configurationLocation = confLoc;
    }
    public getConfigurationLocation(): string {
        return this.configurationLocation;
    }
    private getHomeLocation(appsDir: string, appsDirTemp: string): string {
        var fileString: string;
        if (process.platform == 'darwin' || process.platform == 'linux') {
            fileString = "bin" + Path.sep + "<[nN]><[eE]><[oO]>4<[jJ]>";
        } else {
            fileString = "bin" + Path.sep + "<[nN]><[eE]><[oO]>4<[jJ]>*";
        }
        if (fs.existsSync(appsDir)) {
            var files: Array<string> = fsFinder.from(appsDir).findFiles(fileString);
            if (files.length > 0) {
                var path = Path.normalize(Path.dirname(files[0]) + Path.sep + "..");
                this.active = true;
            }
        }
        if (fs.existsSync(appsDirTemp)) {
            var files: Array<string> = fsFinder.from(appsDirTemp).findFiles(fileString);
            if (files.length > 0) {
                var path = Path.normalize(Path.dirname(files[0]) + Path.sep + "..");
                this.active = true;
            }
        }
        if (!this.active) {
            var path = "";
            console.log("Neo4J was not found. Please download neo4j to the folder " + appsDir);
            return "";
        }
        return path;
    }
}

export class trManager {

    neo4Jconf: Neo4Jconfiguration;
    running: boolean;
    neo4JProcess: childProcess.ChildProcess;
    daemon: Daemon;
    enabled: boolean = false;

    constructor(setSettingsCallback: Function, enabled: boolean) {
        this.enabled = enabled;
        this.running = false;

        if (this.enabled) {
            this.startDaemon(setSettingsCallback);
        }
    }

    public getDaemonPort(): number {
        return this.daemon.port;
    }

    public sendCypherQuery(query:string, params?:any){
        if (!params){
            params = {};
        }
        return this.daemon.sendCypherResponse(query, params);
    }

    public recordTrace(jsonObj: Object) {
        if (!this.enabled) {
            return {};
        }
        this.daemon.recordTrace(jsonObj);
    }

    public start(neo4JConfLoc: string, appDir: string, appsDirTemp: string) {
        if (!this.enabled) {
            return;
        }

        if (!this.neo4Jconf || !this.neo4Jconf.active) {
            this.neo4Jconf = new Neo4Jconfiguration(neo4JConfLoc, appDir, appsDirTemp);
        } else {
            this.neo4Jconf.setConfigurationLocation(neo4JConfLoc);
            this.neo4Jconf.setBinaryLocation();
        }
        if (this.neo4Jconf.active) {
            this.running = true;
            this.neo4JProcess = this.startNeo4J();
            this.connectDaemon(30000);
        }
    }

    public changeDataBase(projectLocation: string, appDir: string, appsDirTemp: string) {
        if (!this.enabled) {
            return;
        }

        var confLoc: string = projectLocation + Path.sep + Project.PATH_TRACEABILITY;
        if (this.running) {
            this.stop(this.start.bind(this, confLoc, appDir));
        } else {
            this.start(confLoc, appDir, appsDirTemp);
        }
    }

    public connectDaemon(timeOut: number, counter?: number, err?: Error) {
        if (!this.enabled) {
            return;
        }

        if (!counter) {
            counter = 0;
        }
        if (counter * 2000 > timeOut) {
            var reason: string;
            if (err) {
                reason = err.message;
            } else {
                reason = "Maybe timeout to small."
            }
            console.log("Unable to connect Daemon to Neo4J. Tried " + counter + "times for in total " + timeOut + " Milliseconds. Reason: " + reason);
            return;
        }
        var neo4jURL: string = "http://" + this.neo4Jconf.username + ":" + this.neo4Jconf.password + "@localhost:" + this.neo4Jconf.port;
        if (this.running) {
            this.daemon.connect(neo4jURL, (function (timeOut: number, counter: number, err: Error) {
                counter = counter + 1;
                if (counter > 7) {
                    console.log('Connection to Neo4J failed. Trying one more time.');
                }
                setTimeout(this.connectDaemon.bind(this, timeOut, counter, err), 2000);
            }).bind(this, timeOut, counter));
        } else {
            setTimeout(this.connectDaemon.bind(this, timeOut, counter, new Error("Neo4J is not running")), 2000);
        }
    }
    private startDaemon(setSettingsCallback: Function) {
        this.daemon = new Daemon();
        this.daemon.start(8083, this.daemon.start.bind(this.daemon, 0, function () {
            console.log("Unable to start daemon.");
        }, this.setDaemonPort.bind(null, setSettingsCallback)), this.setDaemonPort.bind(0, setSettingsCallback));
    }
    private setDaemonPort(setSettingsCallback: Function, port: number) {
        setSettingsCallback(SettingKeys.DAEMON_URL, "localhost:" + port);
    }
    private checkDataBase() {
        var confFileName: string = this.neo4Jconf.getConfigurationLocation() + Path.sep + "neo4j.conf";
        if (!fs.existsSync(this.neo4Jconf.getConfigurationLocation())) {
            fs.mkdir(this.neo4Jconf.getConfigurationLocation(), function (err: Error) { console.log("Unable to create database folder " + this.neo4Jconf.getConfigurationLocation()); });
        }
        if (!fs.existsSync(confFileName)) {
            fs.writeFileSync(confFileName, fs.readFileSync(this.neo4Jconf.homeLocation + Path.sep + "conf" + Path.sep + "neo4j.conf"));
        }
        if (fs.existsSync(confFileName)) {
            var fileContent: string = fs.readFileSync(confFileName, "UTF-8");
            var dblocation: string = this.neo4Jconf.getConfigurationLocation() + Path.sep + "data";
            dblocation = dblocation.split(Path.sep).join("/");
            fileContent = fileContent.replace(RegExp(".*dbms\.directories\.data=.*"), "dbms.directories.data=" + dblocation);
            fs.writeFileSync(confFileName, fileContent);
        }
        if (!fs.existsSync(this.neo4Jconf.getConfigurationLocation() + Path.sep + "data")) {
            fs.mkdir(this.neo4Jconf.getConfigurationLocation() + Path.sep + "data");
        }
        if (!fs.existsSync(this.neo4Jconf.getConfigurationLocation() + Path.sep + "data" + Path.sep + "dbms")) {
            fs.mkdir(this.neo4Jconf.getConfigurationLocation() + Path.sep + "data" + Path.sep + "dbms");
        }
        fs.writeFileSync(this.neo4Jconf.getConfigurationLocation() + Path.sep + "data" + Path.sep + "dbms" + Path.sep + "auth", "intoCPSApp:SHA-256,9780635B5BC9974CCB47A230B20DEF8069A26E2B3EC954A76E4034B9308042B0,2ADAC311B595F9670EBA0424F5620BED:", { flag: 'w' });
    }
    private startNeo4J(): childProcess.ChildProcess {
        try {
            this.checkDataBase();
            var spawn = require("child_process").spawn;
            var neo4JExecOptions: Object = {
                env: Object.assign(process.env,
                    {
                        "NEO4J_BIN": this.neo4Jconf.binariesLocation,
                        "NEO4J_HOME": this.neo4Jconf.homeLocation,
                        "NEO4J_CONF": this.neo4Jconf.getConfigurationLocation(),
                    }),
                detached: false,
                shell: true,
                cwd: this.neo4Jconf.binariesLocation
            };
            let argv: string[] = [];
            if (process.platform == "linux")
                argv.push("/bin/bash");
            if (process.platform == "win32") {
                argv.push("neo4j");
            } else {
                argv.push(Path.join(this.neo4Jconf.binariesLocation, "neo4j"));
            }
            argv.push("console");
            console.log("Starting Neo4J from path " + this.neo4Jconf.binariesLocation + ". With database configuration: " + this.neo4Jconf.getConfigurationLocation());
            var localNeo4JProcess: childProcess.ChildProcess = spawn(argv[0], argv.splice(1), neo4JExecOptions);
        } catch (err) {
            this.errorOnNeo4JStart(err);
            return undefined;
        }
        return localNeo4JProcess;
    }

    private errorOnNeo4JStart(err: Error) {
        this.running = false;
        console.log("Unable to start Neo4J due to error: " + err.message);
        console.log(err.stack);
    }

    public stop(nextCallback?: Function) {
        if (!this.enabled) {
            return;
        }


        if (!this.running) {
            nextCallback();
            return;
        }
        if (nextCallback) {
            this.stopNeo4J(nextCallback);
        } else {
            this.stopNeo4J(function () { });
        }
    }

    private stopNeo4J(nextCallback: Function) {
        var kill = require('tree-kill');
        kill(this.neo4JProcess.pid, 'SIGKILL', (function (nextCallback: Function, err: any) {
            if (err) {
                console.log("Failed to close Neo4J. " + "It was not possible to close Neo4J. Pid: " + this.neo4JProcess.pid);
            }
            else {
                this.neo4JProcess = null;
            }
            this.running = false;
            nextCallback();
        }).bind(this, nextCallback));
    };
}
