
import childProcess = require("child_process");
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
    private dbFilesSubfoder: string = 'db';

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

    public sendCypherQuery(query: string, params?: any) {
        if (!params) {
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
            this.startNeo4J().then((p) => {
                this.neo4JProcess = p;
                if (this.enabled) {
                    this.daemon.setDBfileLocation(this.getDBfileLocation());
                    let neo4jURL: string = "http://" + this.neo4Jconf.username + ":" + this.neo4Jconf.password + "@localhost:" + this.neo4Jconf.port;
                    return this.daemon.connect2(neo4jURL, 16);
                }
            }).then((connected) => {
                if (connected) {
                    this.reBuildDataBase();
                }
            }).catch((err) => {
                const { dialog } = require('electron')
                dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: "Neo4J: " + err.message }, function (button: any) { });
            });
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

    
    private startDaemon(setSettingsCallback: Function) {
        this.daemon = new Daemon();
        this.daemon.start(8083, this.daemon.start.bind(this.daemon, 0, function () {
            console.log("Unable to start daemon.");
        }, this.setDaemonPort.bind(null, setSettingsCallback)), this.setDaemonPort.bind(0, setSettingsCallback));
    }
    private setDaemonPort(setSettingsCallback: Function, port: number) {
        setSettingsCallback(SettingKeys.DAEMON_URL, "localhost:" + port);
    }
    public getDBfileLocation(): string {
        return this.neo4Jconf.getConfigurationLocation() + Path.sep + this.dbFilesSubfoder;
    }

    private removeEmptyLinesAndComments(data: string) {
        var lines = "";
        data.split("\n").forEach(line => {
            if (line.trim().length > 0 && !line.startsWith("#"))
                lines += line + "\n";

        });
        return lines;
    }

    private toNixPathFormat(path: string) {
        return path.split(Path.sep).join("/");
    }
    private checkDataBase() {

        let CreateFolderIfNotExist = (path: string) => {
            return new Promise((resolve, reject) => {
                if (!fs.existsSync(path)) {
                    fs.mkdir(path, (err: Error) => {
                        if (err) {
                            console.log("Unable to create database folder " + path);
                            reject(err);
                        } else
                            resolve();
                    });
                } else {
                    resolve();
                }
            });
        };

        let writeDbConfig = () => {
            return new Promise((resolve, reject) => {
                var confFileName: string = Path.join(this.neo4Jconf.getConfigurationLocation(), "neo4j.conf");

                let neo4jDefaultConfig = Path.join(this.neo4Jconf.homeLocation, "conf", "neo4j.conf");

                var fileContent: string = fs.readFileSync(neo4jDefaultConfig, "UTF-8");

                //remove all text from the config string
                fileContent = this.removeEmptyLinesAndComments(fileContent)

                fileContent += "dbms.directories.data=" + this.toNixPathFormat(Path.join(this.neo4Jconf.getConfigurationLocation(), "data")) + '\n';
                fileContent += 'dbms.connector.http.listen_address=:' + this.neo4Jconf.port + '\n';
                fileContent += 'dbms.directories.logs=' + this.toNixPathFormat(this.neo4Jconf.getConfigurationLocation()) + ' \n';
                fileContent += 'dbms.logs.http.enabled=true' + '\n';

                fs.writeFile(Path.join(this.neo4Jconf.getConfigurationLocation(), ".gitignore"), "data\n*.log\n*.conf\n");

                fs.writeFileSync(confFileName, fileContent);
                resolve();

            });
        };

        return CreateFolderIfNotExist(this.neo4Jconf.getConfigurationLocation()).then(() => {
            return CreateFolderIfNotExist(this.getDBfileLocation())
        }).then(() => {
            return writeDbConfig()
        }).then(() => {
            return CreateFolderIfNotExist(Path.join(this.neo4Jconf.getConfigurationLocation(), "data"))
        }).then(() => {
            return CreateFolderIfNotExist(Path.join(this.neo4Jconf.getConfigurationLocation(), "data", "dbms"))
        }).then(() => {
            fs.writeFileSync(Path.join(this.neo4Jconf.getConfigurationLocation(), "data", "dbms", "auth"), "intoCPSApp:SHA-256,9780635B5BC9974CCB47A230B20DEF8069A26E2B3EC954A76E4034B9308042B0,2ADAC311B595F9670EBA0424F5620BED:", { flag: 'w' });
        });
    }
    private clearDataBase() {
        this.sendCypherQuery('MATCH (n) DETACH DELETE n');
        return;
    }
    private buildDataBase(dataFolder: string) {
        fs.readdir(dataFolder, (err: any, files: any) => {
            files.forEach((file: string) => {
                if (!file.startsWith(".") && file.endsWith(".dmsg"))

                    this.loadMessageFileToDB(file);
            });
        });
        return;
    }
    private loadMessageFileToDB(file: string) {

        fs.readFile(Path.join(this.getDBfileLocation(), file), 'utf8', (err: Error, data: string) => {
            console.info("Tracebility processing: " + file);
            this.daemon.recordTraceNoFile(JSON.parse(data))
        });
    }
    private reBuildDataBase() {
        this.clearDataBase();
        this.buildDataBase(this.getDBfileLocation());
        return;
    }

    private spawnNeo4JProcess(): Promise<childProcess.ChildProcess> {

        return new Promise((resolve, reject) => {
            try {

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
                console.log("Starting Neo4J from path '" + this.neo4Jconf.binariesLocation + "'. With database configuration: " + this.neo4Jconf.getConfigurationLocation());
                var localNeo4JProcess: childProcess.ChildProcess = spawn(argv[0], argv.splice(1), neo4JExecOptions);

                localNeo4JProcess.stdout.on('data', function (data: any) {
                    console.info('neo4j (stdout): ' + data);
                });
                localNeo4JProcess.stderr.on('data', function (data: any) {
                    console.error('neo4j (stdout): ' + data);
                });
                resolve(localNeo4JProcess);
            } catch (err) {
                this.running = false;
                console.log("Unable to start Neo4J due to error: " + err.message);
                console.log(err.stack);
                reject(err);
            }
        });
    }
    private startNeo4J(): Promise<childProcess.ChildProcess> {

        return this.checkDataBase().then(() => {
            return this.spawnNeo4JProcess()
        });
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
