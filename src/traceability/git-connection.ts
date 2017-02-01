import { IntoCpsApp } from "./../IntoCpsApp";
var execSync = require('child_process').execSync;
let appInstance = IntoCpsApp.getInstance();
export class GitCommands{

    private static removeNewline(str: string) : string{
        return str.substr(0,str.length-1);
    }

    public static getUserData(){
        var username: string = this.removeNewline(this.execGitCmd("git config user.name").toString());
        var email: string = this.removeNewline(this.execGitCmd("git config user.email").toString());
        return new UserData(username, email);
    } 

    public static getHashOfFile(path: string) : string{
        console.log("path: " + path);
        return this.removeNewline(execSync(`git hash-object "${path}"`).toString());        
    }

    public static commitFile(path: string){
        this.execGitCmd(`git add "${path}"`);
        this.execGitCmd(`git commit -m "autocommit" "${path}"`);
    }

    public static execGitCmd(gitCmd: string)
    {
        return execSync(gitCmd,{cwd:appInstance.getActiveProject().getRootFilePath()});
    }
}



export class UserData{
    public username: string;
    public email: string;
    public constructor(username:string, email: string){
        this.username = username;
        this.email = email;
    }
}