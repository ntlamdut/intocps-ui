// Utility function
export function getCustomFs(): any {
    var fs = require('fs');
    fs.removeRecursive = function (path: string, cb: (err: any, v: any) => void) {
        var self = this;

        fs.stat(path, function (err: any, stats: any) {
            if (err) {
                cb(err, stats);
                return;
            }
            if (stats.isFile()) {
                fs.unlink(path, function (err: any) {
                    if (err) {
                        cb(err, null);
                    } else {
                        cb(null, true);
                    }
                    return;
                });
            } else if (stats.isDirectory()) {
                // A folder may contain files
                // We need to delete the files first
                // When all are deleted we could delete the 
                // dir itself
                fs.readdir(path, function (err: any, files: any) {
                    if (err) {
                        cb(err, null);
                        return;
                    }
                    var f_length = files.length;
                    var f_delete_index = 0;

                    // Check and keep track of deleted files
                    // Delete the folder itself when the files are deleted

                    var checkStatus = function () {
                        // We check the status
                        // and count till we r done
                        if (f_length === f_delete_index) {
                            fs.rmdir(path, function (err: any) {
                                if (err) {
                                    cb(err, null);
                                } else {
                                    cb(null, true);
                                }
                            });
                            return true;
                        }
                        return false;
                    };
                    if (!checkStatus()) {
                        for (var i = 0; i < f_length; i++) {
                            // Create a local scope for filePath
                            // Not really needed, but just good practice
                            // (as strings arn't passed by reference)
                            (function () {
                                var filePath = path + '/' + files[i];
                                // Add a named function as callback
                                // just to enlighten debugging
                                fs.removeRecursive(filePath, function removeRecursiveCB(err: any, status: any) {
                                    if (!err) {
                                        f_delete_index++;
                                        checkStatus();
                                    } else {
                                        cb(err, null);
                                        return;
                                    }
                                });

                            })()
                        }
                    }
                });
            }
        });
    };
    return fs;
}