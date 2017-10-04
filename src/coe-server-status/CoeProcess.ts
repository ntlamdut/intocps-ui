
import { IntoCpsApp } from "../IntoCpsApp";
import { SettingKeys } from "../settings/SettingKeys";
import { ISettingsValues } from "../settings/ISettingsValues";
import * as Path from 'path';
import fs = require('fs');
import * as child_process from 'child_process'


export class CoeProcess {
    private settings: ISettingsValues
    private static firstStart = true;
    private process: child_process.ChildProcess = null;
    private maxReadSize = 500000;

    public constructor(settings: ISettingsValues) {
        this.settings = settings;
    }

    //get the url needed to obtain the version of the coe
    public static getCoeVersionUrl() {
        let url = IntoCpsApp.getInstance().getSettings().getSetting(SettingKeys.COE_URL) || "localhost:8082";

        var request = require("request");

        return url = `http://${url}/version`;
    };

    //stop the coe if running
    public stop() {
        if (fs.existsSync(this.getPidFilePath())) {
            this.internalKill(this.getPid(), () => {
                if (fs.existsSync(this.getPidFilePath()))
                    fs.unlinkSync(this.getPidFilePath());
            });
        }

        if (this.process != null && this.process.connected) {
            this.process.kill();
        }

    }

    private internalKill(pid: string, successHandler: any) {
        var kill = require('tree-kill');

        if (pid && pid.toString().trim()) {
            console.info("Killing: '" + pid + "'")
            kill(pid, 'SIGKILL', (err: any) => {
                if (err) {
                    console.error("Failed to close COE. " + "It was not possible to close the COE. Pid: " + pid)
                }
                if (!err) {
                    if (successHandler) {
                        successHandler();
                    }
                }
            });
        }
    }

    private getWorkingDir() {
        let installDir = this.settings.getValue(SettingKeys.INSTALL_DIR);
        let childCwd = Path.join(installDir, "coe-working-dir");
        return childCwd;
    }

    private getLogFilePath() {
        return Path.join(this.getWorkingDir(), "console.log");
    }

    private getLog4JFilePath() {
        return Path.join(this.getWorkingDir(), "coe.log");
    }

    private getPidFilePath() {
        return Path.join(this.getWorkingDir(), "coe.pid");
    }

    //get the pid of the running coe process
    public getPid(): string {
        if (fs.existsSync(this.getPidFilePath())) {
            //this.stop();
            var pid = fs.readFileSync(this.getPidFilePath());
            return pid + ""
        }
        return null;
    }

    //get error log line prefix used for the err stream
    public getErrorLogLinePrefix(): string {
        return String.fromCharCode(25);
    }

    //check if the coe is running, this is done based no the existence of the pid file
    public isRunning() {
        let pid = this.getPid();
        if (pid == null) {
            return false;
        }
        let isRunning = require('is-running')(pid)
        if (!isRunning) {
            fs.unlinkSync(this.getPidFilePath());
        }
        return isRunning;
    }

    //check if the streams redirection to the log is active
    public isLogRedirectActive() {
        return this.process != null;
    }

    //get the path to the coe jar which will be launched
    public getCoePath() {
        let installDir = this.settings.getValue(SettingKeys.INSTALL_TMP_DIR);
        var coePath = Path.join(installDir, "coe.jar");
        let overrideCoePath = this.settings.getValue(SettingKeys.COE_JAR_PATH);
        if (fs.existsSync(overrideCoePath)) {
            coePath = overrideCoePath;
        }
        return coePath;
    }

    private checkCoeAvaliablity() {
        return fs.existsSync(this.getCoePath());
    }

    //start or restart the COE process
    public start() {

        if (!this.checkCoeAvaliablity()) {
            const { dialog } = require('electron')
            dialog.showMessageBox({ type: 'error', buttons: ["OK"], message: "Please install the: " + "'Co-simulation Orchestration Engine'" + " first." }, function (button: any) { });
            return;
        }

        if (CoeProcess.firstStart) {
            //fs.unlinkSync(this.getLogFilePath())
            //fs.unlinkSync(this.getPidFilePath());
            CoeProcess.firstStart = false;
        }

        if (fs.existsSync(this.getPidFilePath())) {
            //this.stop();
            var pid = this.getPid();
            if (fs.existsSync(this.getPidFilePath()))
                fs.unlinkSync(this.getPidFilePath());
            this.internalKill(pid + "", null);
        } else {
            if (fs.existsSync(this.getLogFilePath())) {
                // fs.unlinkSync(this.getLogFilePath())
            }
        }
        var spawn = child_process.spawn;


        let childCwd = this.getWorkingDir();
        let env: any = process.env;
        env["RTT_OP_KEY"] = "TMS:19999:FMI";

        var mkdirp = require('mkdirp');
        mkdirp.sync(childCwd);

        let logFile = this.getLogFilePath();

        var child = spawn('java', ['-jar', this.getCoePath()], {
            detached: true,
            shell: false,
            cwd: childCwd,
            env: env
        });
        child.unref();

        this.process = child;

        console.info("Starting COE process pid = " + child.pid);
        fs.writeFile(this.getPidFilePath(), child.pid, function (err) {
            if (err) throw err;
        });

        child.stdout.on('data', function (data: any) {
            //console.log('stdout: ' + data);
            //Here is where the output goes
            let dd = (data + "").split("\n");

            dd.forEach(line => {
                if (line.trim().length != 0) {
                    //console.info(line);
                    fs.appendFile(logFile, line + "\n", function (err) {
                        if (err) throw err;
                    });

                }
            });
        });

        child.stderr.on('data', (data: any) => {
            //console.log('stderr: ' + data);
            let dd = (data + "").split("\n");

            dd.forEach(line => {
                if (line.trim().length != 0) {
                    //console.info(line);
                    fs.appendFile(logFile, this.getErrorLogLinePrefix() + line + "\n", function (err) {
                        if (err) throw err;
                    });

                }
            });
        });

        child.on('error', (err) => {
            console.log('Failed to start subprocess.');
            console.error(err);
            this.stop();
        });

        child.on('exit', (code, signal) => {
            console.info("child process exit. Code: " + code + " Signal: " + signal)
            //if (fs.existsSync(this.getPidFilePath()))
            //    fs.unlinkSync(this.getPidFilePath());
            this.process = null;
        });


    }

    // enable subscription to the coe log file if it exists, otherwise it is created
    public subscribe(callback: any) {
        let path = this.getLogFilePath();

        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, "");
        }

        if (fs.existsSync(path)) {

            var Tail = require('tail').Tail;

            this.partialFileRead(100000, path, (ds: string) => {
                callback("( truncated...)\n\n" + ds);

                var tail = new Tail(path);
                tail.on("line", function (data: any) {
                    try {
                        callback(data);
                    } catch (e) {
                        if ((e + "").indexOf("Error: Attempting to call a function in a renderer window that has been closed or released") != 0) {
                            throw e;
                        }
                    }
                })

            });
        }
    }

    public subscribeLog4J2(callback: any) {
        console.log("subscribeLog4J2 Invoked");
        let logFile: string = this.getLog4JFilePath();;

        if (!fs.existsSync(logFile)) {
            fs.writeFileSync(logFile, "");
        }

        console.log("subscribeLog4J2 Invoking watchfile ");
        let usePrevSize = false;
        let prevSize = 0;
        fs.watchFile(logFile, (current, previous) => {
            let fileSize = current.size;
            console.log("subscribeLog4J2 Watching file: " + logFile);

            //If the size has not changed, then do not read.
            if ( !usePrevSize && previous.size == current.size) { return; }

            //If a custom size has been used, because there was too much new data, then use this for the sizeDiff.
            let sizeDiff = (() => {
                if (usePrevSize) {
                    return current.size - prevSize;
                }
                else {
                    return fileSize - previous.size;
                }
            })();

            //If less than zero then log file has been truncated since last read.
            //  Set fileSize to zero and set the size difference to the current size of the file or maxReadSize.
            //Else if the sizeDiff is too loo large and the prevSize was set by the last invocation of the watch function
            //  then update the prevSize and set the sizeDiff to maxReadSize.
            //Else the sizeDiff is <= maxReadSize 
            //  then all data can be loaded and usePrevSize can be disabled.
            console.log("a");
            if (sizeDiff < 0) {
                fileSize = 0;
                if (current.size > this.maxReadSize) {
                    sizeDiff = this.maxReadSize;
                }
                else {
                    sizeDiff = current.size;
                }

            } else if (sizeDiff > this.maxReadSize) {
                if (usePrevSize) {
                    prevSize += prevSize + sizeDiff;
                }

                sizeDiff = this.maxReadSize;
            }
            else {
                if (usePrevSize) {
                    usePrevSize = false;
                    sizeDiff = current.size - prevSize;
                }
            }

            // Create a buffer to hold only the data we intend to read.
            var buffer = new Buffer(sizeDiff);
            // Obtain reference to the file's descriptor.
            var fileDescriptor = fs.openSync(logFile, 'r');

            // Synchronously read from the file starting from where the last read ended.
            console.log("Reading from: " + (usePrevSize ? prevSize : previous.size) + " with size: " + sizeDiff);

            fs.readSync(fileDescriptor, buffer, 0, sizeDiff, usePrevSize ? prevSize : previous.size);

            fs.closeSync(fileDescriptor); // close the file


            // Parse the line(s) in the buffer.
            parseBuffer(buffer);
        });

        function stop() {
            fs.unwatchFile(logFile);
        };

        function parseBuffer(buffer: any) {
            callback(buffer.toString());
            // Iterate over each line in the buffer.
            //let strings: Array<string> = buffer.toString().split("\n");
            //console.log("Parsed lines: " + strings.length);
        };
    }

    // enable subscription to the coe log file if it exists, otherwise it is created
    public subscribeLog4J(callback: any) {
        let path = this.getLog4JFilePath();

        if (!fs.existsSync(path)) {
            fs.writeFileSync(path, "");
        }

        if (fs.existsSync(path)) {

            var Tail = require('tail').Tail;

            this.partialFileRead(100000, path, (ds: string) => {
                callback("( truncated...)\n\n" + ds);

                var options: any = { interval: 5000 };
                var tail = new Tail(path, options);
                tail.on("line", function (data: any) {
                    try {
                        callback(data);
                    } catch (e) {
                        if ((e + "").indexOf("Error: Attempting to call a function in a renderer window that has been closed or released") != 0) {
                            throw e;
                        }
                    }
                });
            })
        }
    }

    // utility method to load the tail of a large file
    private partialFileRead(size: number, path: string, callback: any) {
        fs.stat(path, (err, stats) => {
            var offset = 0;
            let MaxFileSize = size;
            if (stats.size > MaxFileSize) {
                offset = stats.size - MaxFileSize;
            }

            fs.open(path, 'r+', function (err, fd) {
                if (err) {
                    return console.error(err);
                }

                var buf = new Buffer(MaxFileSize + 1000);

                fs.read(fd, buf, 0, buf.length, offset, function (err, bytes) {
                    fs.close(fd);
                    if (err) {
                        console.info(err);
                        return;
                    }

                    // Print only read bytes to avoid junk.
                    if (bytes > 0) {

                        let readData = buf.slice(0, bytes).toString("UTF-8");
                        callback(readData);
                    }
                });
            });
        });
    }
}