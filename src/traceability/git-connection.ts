var execSync = require('child_process').execSync;

export class GitCommands{

    private static removeNewline(str: string) : string{
        return str.substr(0,str.length-1);
    }

    public static getUserData(){
        var username: string = this.removeNewline(execSync("git config user.name").toString());
        var email: string = this.removeNewline(execSync("git config user.email").toString());
        return new UserData(username, email);
    } 

    public static getHashOfFile(path: string) : string{
        return this.removeNewline(execSync(`git hash-object "${path}" `).toString());        
    }

    public static commitFile(path: string){
        execSync(`git add "${path}" `);
        execSync(`git commit "${path}" `);
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