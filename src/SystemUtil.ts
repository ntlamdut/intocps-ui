
export function openPath(path: string)
{
    var command: string = null;

    //http://stackoverflow.com/questions/8683895/how-do-i-determine-the-current-operating-system-with-node-js
    if (process.platform === 'darwin') {
        command = "open";
    } else if (process.platform === 'win32') {
        command = "explorer.exe"
    } else if (process.platform === 'linux') {
        command = "nautilus"
    }

    if (command != null) {
        var spawn = require('child_process').spawn;

        var child = spawn(command, [path], {
            detached: true,
            shell: false,
            // cwd: childCwd
        });
        child.unref();

        child.stdout.on('data', function (data: any) {
            console.log('stdout: ' + data);

        });
        child.stderr.on('data', function (data: any) {
            console.log('stderr: ' + data);

        });
        child.on('close', function (code: any) {
            console.log('closing code: ' + code);

        });

    }
}