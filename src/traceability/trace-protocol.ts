import * as GitConn from "./git-connection"
import * as uuid from "uuid"

interface Entity {
    serialize(): any;
    shortSerialize(): any;
}

class MsgCreator {

    private serializedObject: any = {};

    constructor() { }

    public static CreateMsg() {
        return new MsgCreator();
    }

    public getSerializedObject() {
        return this.serializedObject;
    }

    public setDefaultRootEntries() {
        this.serializedObject["xmlns:rdf"] = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
        this.serializedObject["xmlns:prov"] = "http://www.w3.org/ns/prov#";
        this.serializedObject["xmlns:intocps"] = "http://www.w3.org/ns/intocps#";
        this.serializedObject["messageFormatVersion"] = "0.2"
        return this;
    }

    public setAbout(about: string) {
        if (about)
            this.serializedObject["rdf:about"] = about;
        return this;
    }

    public setActivity(activity: any) {
        if (activity)
            this.serializedObject["prov:activity"] = activity;
        return this;
    }

    public setEntities(entities: any) {
        if (entities)
            this.serializedObject["prov:entity"] = entities;
        return this;
    }

    public setUsed(used: any) {
        if (used)
            this.serializedObject["prov:used"] = used;
        return this;
    }

    public setWasGeneratedBy(wasGeneratedBy: any) {
        if (wasGeneratedBy)
            this.serializedObject["prov:wasGeneratedBy"] = wasGeneratedBy;
        return this;
    }

    public setWasDerivedFrom(wasDerivedFrom: any) {
        if (wasDerivedFrom)
            this.serializedObject["prov:wasDerivedFrom"] = wasDerivedFrom;
        return this;
    }

    public setWasAttributedTo(wasAttributedTo: any) {
        if (wasAttributedTo)
            this.serializedObject["prov:wasAttributedTo"] = wasAttributedTo;
        return this;
    }

    public setWasAssociatedWith(wasAssociatedWith: any) {
        if (wasAssociatedWith)
            this.serializedObject["prov:wasAssociatedWith"] = wasAssociatedWith;
        return this;
    }

    public setAgent(agent: any) {
        if (agent)
            this.serializedObject["prov:agent"] = agent;
        return this;
    }

    public setTime(time: string) {
        if (time)
            this.serializedObject["intocps:time"] = time;
        return this;
    }
    public setType(type: string) {
        if (type)
            this.serializedObject["intocps:type"] = type;
        return this;
    }

    public setHash(hash: string) {
        if (hash)
            this.serializedObject["intocps:hash"] = hash;
        return this;
    }

    public setPath(path: string) {
        if (path)
            this.serializedObject["intocps:path"] = path;
        return this;
    }

    public setCommit(commit: string) {
        if (commit)
            this.serializedObject["intocps:commit"] = commit;
        return this;
    }

    public setComment(comment: string) {
        if (comment)
            this.serializedObject["intocps:comment"] = comment;
        return this;
    }

    public setUrl(url: string) {
        if (url)
            this.serializedObject["intocps:url"] = url;
        return this;
    }

    public setVersion(version: string) {
        if (version)
            this.serializedObject["intocps:version"] = version;
        return this;
    }

    public setName(name: string) {
        if (name)
            this.serializedObject["intocps:name"] = name;
        return this;
    }

    public setEmail(email: string) {
        if (email)
            this.serializedObject["intocps:email"] = email;
        return this;
    }
}

export class RootMessage {
    public entities: Array<Entity> = new Array<Entity>();
    public activity: Activity;
    public agents: Array<EntityAgent> = new Array<EntityAgent>();

    public serialize(): any {
        return MsgCreator.CreateMsg()
            .setDefaultRootEntries()
            .setActivity(this.activity ? this.activity.serialize() : null)
            .setEntities(this.entities ? this.entities.map((entity) => entity.serialize()) : null)
            .setAgent(this.agents ? this.agents.map((agent) => agent.serialize()) : null)
            .getSerializedObject();
    }
}

export class Activity {
    // rdf
    // required
    public about: string;

    //into-cps
    // required
    public time: string;
    // required
    public type: "configurationCreation";

    //prov
    // optional
    public used: Array<Entity> = new Array<Entity>();
    //optional
    public wasAssociatedWith: EntityAgent = new EntityAgent();


    public unique: string;

    public constructor() {
        this.unique = uuid.v4();
        this.setTimeToNow();
    }

    public setTimeToNow() {
        this.time = (new Date()).toISOString();
    }

    public calcAndSetAbout() {
        this.about = `Activity.${this.type}:${this.time}#${this.unique}`
    }

    private canBeSerialized() {
        if (!(this.about && this.unique && this.type && this.time)) {
            console.error(`It was not possible to serialize the activity. One of the following values are not allowed: about[${this.about}], unique[${this.unique}], type[${this.type}] or/and time[${this.time}]`)
            return false;
        }
        else
            return true;
    }

    public serialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg()
                .setAbout(this.about)
                .setTime(this.time)
                .setType(this.type)
                .setUsed(this.used ? this.used.map((entity) => entity.shortSerialize()) : null)
                .setWasAssociatedWith(this.wasAssociatedWith ? this.wasAssociatedWith.shortSerialize() : null)
                .getSerializedObject()
        else
            return {};
    }

    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setActivity(
                MsgCreator.CreateMsg().setAbout(this.about).getSerializedObject())
                .getSerializedObject();
        else
            return {}
    }
}

export class EntityFile implements Entity {
    //rdf
    //required
    private about: string;

    //intocps
    // required
    public type: "configuration";
    // required
    public hash: string;
    // required
    public path: string;
    // optional
    public commit: string;
    // optional
    public comment: string;
    // optional
    public url: string;

    //prov
    // required referring to an agent
    public wasAttributedTo: EntityAgent = new EntityAgent();
    // optional referring to an activity
    public wasGeneratedBy: Activity;
    // optional referring to an earlier version if one exists
    public wasDerivedFrom: EntityFile;

    public calcAbout() {
        this.about = `Entity.${this.type}:${this.path}#${this.hash}`;
    }

    private canBeSerialized() {
        if (!(this.about && this.type && this.hash && this.path && this.wasAttributedTo)) {
            console.error(`It was not possible to serialize the EntityFile. One of the following values are not allowed: about[${this.about}], type[${this.type}], hash[${this.hash}], path[${this.path}] or/and wasAttributedTo[${this.wasAttributedTo.shortSerialize()}]`)
            return false;
        }
        else
            return true;
    }

    public serialize(): any {
        if (this.canBeSerialized)
            return MsgCreator.CreateMsg()
                .setAbout(this.about)
                .setType(this.type)
                .setHash(this.hash)
                .setPath(this.path)
                .setCommit(this.commit)
                .setComment(this.comment)
                .setUrl(this.url)
                .setWasAttributedTo(this.wasAttributedTo ? this.wasAttributedTo.shortSerialize() : null)
                .setWasGeneratedBy(this.wasGeneratedBy ? this.wasGeneratedBy.shortSerialize() : null)
                .setWasDerivedFrom(this.wasDerivedFrom ? this.wasDerivedFrom.shortSerialize() : null)
                .getSerializedObject();
        else return {}
    }
    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setAbout(this.about).getSerializedObject()
        else return {}
    }
}


export class EntityTool implements Entity {
    //rdf
    // required
    private about: string;
    //intocps
    // required
    //TODO CTTK: Fix version
    private version: string = "1.2";
    // required
    private type: string = "softwareTool";
    // required
    private name: string = "INTO-CPS-APP";


    constructor() {
        this.about = `Entity.${this.type}:${this.name}:${this.version}`;
    }

    private canBeSerialized() {
        if (!(this.version && this.type && this.name && this.about)) {
            console.error(`It was not possible to serialize the EntityTool. One of the following values are not allowed: about[${this.about}], type[${this.type}], version[${this.version}] or/and name[${this.name}]`)
            return false;
        }
        return true;
    }

    public serialize(): any {
        if (this.canBeSerialized())

            return MsgCreator.CreateMsg()
                .setAbout(this.about)
                .setVersion(this.version)
                .setType(this.type)
                .setName(this.name).getSerializedObject();
        else return {}
    }

    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setAbout(this.about).getSerializedObject();
        else return {}
    }
}

export class EntityAgent implements Entity {
    //rdf
    private about: string;

    //intocps
    // required
    public name: string;
    // optional
    public email: string;

    constructor() {
        var agent = GitConn.GitCommands.getUserData();
        this.name = agent.username;
        this.email = agent.email.length > 0 ? agent.email : null;
        this.about = `agent:${this.name}`;
    }

    public getAbout() { return this.about; }

    private canBeSerialized() {
        if (!(this.about && this.name)) {
            console.error(`It was not possible to serialize the EntityAgent. One of the following values are not allowed: about[${this.about}], or/and name[${this.name}]`)
            return false
        }
        else { return true; }
    }

    public serialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg()
                .setAbout(this.getAbout())
                .setName(this.name)
                .setEmail(this.email)
                .getSerializedObject();
        else return {}
    }
    public shortSerialize(): any {
        if (this.canBeSerialized())
            return MsgCreator.CreateMsg().setAgent(MsgCreator.CreateMsg().setAbout(this.getAbout()).getSerializedObject()).getSerializedObject();
        else return {}
    }
}
