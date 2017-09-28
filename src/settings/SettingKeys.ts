// Module contaiing valid setting keys
export namespace SettingKeys {
    export var DEVELOPMENT_MODE = "development_mode";
    export var ACTIVE_PROJECT = "active_project";
    export var INSTALL_DIR = "install_dir";
    export var INSTALL_TMP_DIR = "install_tmp_dir";
    export var COE_URL = "coe_host_url";
    export var TRACE_DAEMON_PORT = "traceability_daemon_port";
    export var COE_REMOTE_HOST = "coe_remote_host";
    export var COE_JAR_PATH = "coe_jar_path";
    export var RTTESTER_INSTALL_DIR: string = "RT-Tester Installation Path";
    export var RTTESTER_MBT_INSTALL_DIR: string = "RT-Tester MBT Installation Path";
    export var RTTESTER_RTTUI: string = "RT-Tester RTTUI3 Executable Path";
    export var RTTESTER_PYTHON: string = "Python Executable Path for RT-Tester";
    export var UPDATE_SITE = "update_site";
    export var DEV_UPDATE_SITE = "dev_update_site";
    export var EXAMPLE_REPO = "example_site";
    export var DEV_EXAMPLE_REPO = "dev_example_site";
    export var DEFAULT_PROJECTS_FOLDER_PATH = "default_projects_folder_path";
    export var ENABLE_TRACEABILITY = "enable_traceability";
    export var LOCAL_UPDATE_SITE = "local_update_site";
    export var USE_LOCAL_UPDATE_SITE = "use_local_update_site";

    export var DEFAULT_VALUES: { [key: string]: any; } = {};
    DEFAULT_VALUES[RTTESTER_INSTALL_DIR] = 'C:/opt/rt-tester';
    DEFAULT_VALUES[RTTESTER_MBT_INSTALL_DIR] = "C:/opt/rtt-mbt";
    DEFAULT_VALUES[RTTESTER_RTTUI] = "C:/Program Files (x86)/Verified/RTTUI3/bin/rttui3.exe";
    DEFAULT_VALUES[RTTESTER_PYTHON] = "C:/Python27/python.exe";
    DEFAULT_VALUES[UPDATE_SITE] = "https://raw.githubusercontent.com/into-cps/into-cps.github.io/master/download/";
    DEFAULT_VALUES[DEV_UPDATE_SITE] = "https://raw.githubusercontent.com/into-cps/into-cps.github.io/development/download/";
    DEFAULT_VALUES[EXAMPLE_REPO] = "https://raw.githubusercontent.com/into-cps/into-cps.github.io/master/examples/examples.json";
    DEFAULT_VALUES[DEV_EXAMPLE_REPO] = "https://raw.githubusercontent.com/into-cps/into-cps.github.io/examples-dev/examples/examples.json";
    DEFAULT_VALUES[DEVELOPMENT_MODE] = false;
    DEFAULT_VALUES[COE_URL] = "localhost:8082";
    DEFAULT_VALUES[TRACE_DAEMON_PORT] = "8083";
    DEFAULT_VALUES[COE_REMOTE_HOST] = false;
    DEFAULT_VALUES[ENABLE_TRACEABILITY] = false;
    DEFAULT_VALUES[LOCAL_UPDATE_SITE] = "";
    DEFAULT_VALUES[USE_LOCAL_UPDATE_SITE] = false;

    export var VALUE_DESCRIPTION: { [key: string]: any; } = {};

    VALUE_DESCRIPTION[DEVELOPMENT_MODE] = "Enables development mode, allowing access to development downloads and increasing debug information output.";
    VALUE_DESCRIPTION[ACTIVE_PROJECT] = "Location of the active project configuration. Meant for internal use only."
    VALUE_DESCRIPTION[INSTALL_DIR] = "Installation folder for downloads obtained through the Download Manager."
    VALUE_DESCRIPTION[INSTALL_TMP_DIR] = "Location for downloads obtained through the Download Manager.";
    VALUE_DESCRIPTION[COE_URL] = "URL used for the COE connection.";
    VALUE_DESCRIPTION[TRACE_DAEMON_PORT] = "The port on which the traceability daemon listens for messages.";
    VALUE_DESCRIPTION[COE_REMOTE_HOST] = "COE is not running on the same filesystem as the INTO-CPS Application.  When checked, FMUs are uploaded to the remote COE.";
    VALUE_DESCRIPTION[COE_JAR_PATH] = "Custom .jar path for the COE. Leave blank to search the install folder.";
    VALUE_DESCRIPTION[RTTESTER_INSTALL_DIR] = "RT-Tester installation location.";
    VALUE_DESCRIPTION[RTTESTER_MBT_INSTALL_DIR] = "RT-Tester MBT installation location.";
    VALUE_DESCRIPTION[RTTESTER_RTTUI] = "Location of RT-Tester RTTUI3 executable.";
    VALUE_DESCRIPTION[RTTESTER_PYTHON] = "Location of Python executable for RT-Tester.";
    VALUE_DESCRIPTION[UPDATE_SITE] = "INTO-CPS Application update site URL.";
    VALUE_DESCRIPTION[DEV_UPDATE_SITE] = "Development mode INTO-CPS Application update site URL.";
    VALUE_DESCRIPTION[EXAMPLE_REPO] = "Examples repository URL.";
    VALUE_DESCRIPTION[DEV_EXAMPLE_REPO] = "Development mode examples repository URL.";
    VALUE_DESCRIPTION[DEFAULT_PROJECTS_FOLDER_PATH] = "Default location of all projects.";
    VALUE_DESCRIPTION[ENABLE_TRACEABILITY] = "Enable tracebility tracking in both the INTO-CPS Application and the traceability daemon.  This enables remote tools to submit traceability information to the open project.";
    VALUE_DESCRIPTION[LOCAL_UPDATE_SITE] = "A file:// URI to a local INCO-CPS Application update site.";
    VALUE_DESCRIPTION[USE_LOCAL_UPDATE_SITE] = "Enable using the local INTO-CPS Application update site.";

    export var VALUE_DISPLAYNAME: { [key: string]: any; } = {};

    VALUE_DISPLAYNAME[DEVELOPMENT_MODE] = "Development Mode";
    VALUE_DISPLAYNAME[ACTIVE_PROJECT] = "Active Project Location";
    VALUE_DISPLAYNAME[INSTALL_DIR] = "Downloads Installation Location";
    VALUE_DISPLAYNAME[INSTALL_TMP_DIR] = "Downloads Location";
    VALUE_DISPLAYNAME[COE_URL] = "COE URL";
    VALUE_DISPLAYNAME[TRACE_DAEMON_PORT] = "Traceability Daemon Port";
    VALUE_DISPLAYNAME[COE_REMOTE_HOST] = "COE Is Remote";
    VALUE_DISPLAYNAME[COE_JAR_PATH] = "COE .jar Location";
    VALUE_DISPLAYNAME[RTTESTER_INSTALL_DIR] = "RT-Tester Istallation Location";
    VALUE_DISPLAYNAME[RTTESTER_MBT_INSTALL_DIR] = "RT-Tester MBT Installation Location";
    VALUE_DISPLAYNAME[RTTESTER_RTTUI] = "RT-Tester RTTUI3 Executable Location";
    VALUE_DISPLAYNAME[RTTESTER_PYTHON] = "Python Executable for RT-Tester";
    VALUE_DISPLAYNAME[UPDATE_SITE] = "Update Site";
    VALUE_DISPLAYNAME[DEV_UPDATE_SITE] = "Development Mode Update Site";
    VALUE_DISPLAYNAME[EXAMPLE_REPO] = "Examples URL";
    VALUE_DISPLAYNAME[DEV_EXAMPLE_REPO] = "Development Mode Examples URL";
    VALUE_DISPLAYNAME[DEFAULT_PROJECTS_FOLDER_PATH] = "Default Project Location";
    VALUE_DISPLAYNAME[ENABLE_TRACEABILITY] = "Enable Traceability";
    VALUE_DISPLAYNAME[LOCAL_UPDATE_SITE] = "Local Update Site";
    VALUE_DISPLAYNAME[USE_LOCAL_UPDATE_SITE] = "Enable Local Update Site";
}
