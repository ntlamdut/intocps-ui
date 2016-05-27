/// <reference path="../../typings/browser/ambient/github-electron/index.d.ts"/>
/// <reference path="../../typings/browser/ambient/node/index.d.ts"/>

// Module contaiing valid setting keys
export namespace SettingKeys {
    export var DEVELOPMENT_MODE="development_mode";
    export var ACTIVE_PROJECT = "active_project";
    export var INSTALL_DIR = "install_dir";
    export var INSTALL_TMP_DIR = "install_tmp_dir";
    export var COE_URL = "coe_host_url";
    export var COE_DEBUG_ENABLED = "coe_debug_enabled";
    export var COE_REMOTE_HOST = "coe_remote_host";
    export var COE_JAR_PATH="coe_jar_path";
    export var RTTESTER_INSTALL_DIR: string = "RT-Tester Installation Path";
    export var RTTESTER_MBT_INSTALL_DIR: string = "RT-Tester MBT Installation Path";
    export var RTTESTER_RTTUI: string = "RT-Tester RTTUI3 Executable Path";
    export var RTTESTER_PYTHON: string = "Python Executable Path for RT-Tester";
    export var UPDATE_SITE = "update_site";
    export var DEV_UPDATE_SITE = "dev_update_site";

    export var DEFAULT_VALUES: { [key: string]: any; } = {};
    DEFAULT_VALUES[RTTESTER_INSTALL_DIR] = 'C:/opt/rt-tester';
    DEFAULT_VALUES[RTTESTER_MBT_INSTALL_DIR] = "C:/opt/rtt-mbt";
    DEFAULT_VALUES[RTTESTER_RTTUI] = "C:/Program Files (x86)/Verified/RTTUI3/rttui3.exe";
    DEFAULT_VALUES[RTTESTER_PYTHON] = "C:/Python27/python.exe";
    DEFAULT_VALUES[UPDATE_SITE] = "https://raw.githubusercontent.com/into-cps/release-site/master/download/";
    DEFAULT_VALUES[DEV_UPDATE_SITE] = "https://raw.githubusercontent.com/into-cps/release-site/development/download/";
    DEFAULT_VALUES[DEVELOPMENT_MODE] = false;
    DEFAULT_VALUES[COE_URL] = "localhost:8082"
}
