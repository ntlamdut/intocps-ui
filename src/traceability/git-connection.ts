import { IntoCpsApp } from "./../IntoCpsApp";
var sha1 = require('node-sha1');
var fs = require('fs');
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
        var fileContent:Buffer = fs.readFileSync(path);
        return sha1(Buffer.concat([new Buffer("blob " + fileContent.length + "\0"), fileContent]));        
    }

    public static commitFile(path: string){
        this.execGitCmd(`git add -f "${path}"`);
        this.execGitCmd(`git commit -m "autocommit" "${path}"`);
    }

     public static addFile(path: string){
        this.execGitCmd(`git add -f "${path}"`);
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