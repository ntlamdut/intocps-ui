// db access
// =========
 
import Promise = require("bluebird");

var cypherQueries = require('./cypherQueries');

var neo4j = require('neo4j');
Promise.promisifyAll(neo4j);
var db:any;

export interface TraceNodeProps {
    uri: string,
    specifier: string, 
    [key: string]: string
}

export interface TraceNodeBase {
        _id: string,
        labels: string[],
        properties: TraceNodeProps
}

export interface TraceNode {
    node: TraceNodeBase
}

export interface TraceRelProps {
    name: string
}

export interface TraceRelBase {
        _id: number,
        type: string,
        properties: TraceRelProps,
        _fromId: number,
        _toId: number
}

export interface TraceRel {
    r: TraceRelBase
}

export interface TraceLink {
    s: TraceNodeBase,
    r: TraceRelBase,
    t: TraceNodeBase
}

module.exports = {

    // connects to neo4j server
    // use an url like 'http://user:passw@host'
    connect: function (url: string) {
        db = new neo4j.GraphDatabase({url: url});
    },

    // retrieves the node with uri 'uri' from neo4j
    getNodeByUri: function (uri: string): Promise<any> {
        return this.sendCypherResponse(cypherQueries.getNodeByUri('uri'), {uri:uri});
    },

    // test connection generates error if connection fails
    testConnection: function (): Promise<any> {
        return this.getNodeByUri("any");
    }, 

    // returns 'true' if the node with uri 'uri' exists otherwise false
    existsNode: function (uri: string): Promise<any> {
        return this.getNodeByUri(uri)
            .then(function (result: Object[]) {
                if (result.length == 0) {
                    return false;
                }
                else {
                    return true;
                }
            });
    },

    modifyNode: function (obj: TraceNode): Promise<any> {
        obj.node.properties = this.prepareProps(obj.node.properties);
        return this.sendCypherResponse(cypherQueries.modifyNode(obj.node.properties, 'uri'), obj.node.properties);
    },
 
    
    // stores a node with uri 'uri' in neo4j
    storeNode: function (obj: TraceNode):Promise<any> {
        obj.node.properties = this.prepareProps(obj.node.properties);
        return this.sendCypherResponse(cypherQueries.storeNode(obj.node.properties, obj.node.properties.specifier), obj.node.properties)
    },

    sendCypherResponse: function(cypherQuery:string, cypherParams:any): Promise<any>{
        return db.cypherAsync({
            query: cypherQuery,
            params: cypherParams
        });
    },



    // retrieves all relations starting at node with uri 'uri' from neo4j
    getRelationsFrom: function (uri: string): Promise<any> {
        return this.sendCypherResponse(cypherQueries.getRelationsFrom('uri'), {uri:uri});
    },

    // retrieves all relations pointing to node with uri 'uri' from neo4j
    getRelationsTo: function (uri: string): Promise<any> {
        return this.sendCypherResponse(cypherQueries.getRelationsTo('uri'), {uri:uri});
    },

    getRelation: function (srcUri: string, relation: string, trgUri: string): Promise<any> {
        var params:Object = {
                src_uri: srcUri,
                rel: relation,
                trg_uri: trgUri,
            };
        return this.sendCypherResponse(cypherQueries.getRelation('src_uri', 'rel', 'trg_uri'), params);
    },

    // returns true if a (a:Entity {uri:srcUri})-[r:Trace {name:relation}]->(b:Entity {uri:trgUri}) relation exists otherwise false 
    existsRelation: function (srcUri: string, relation: string, trgUri: string): Promise<any> {
        return this.getRelation(srcUri, relation, trgUri)
            .then(function (result: Object[]) {
                if (result.length == 0) {
                    return false;
                }
                else {
                    return true;
                }
            });
    },

    // creates a (a:Entity {uri:srcUri})-[r:Trace {name:relation}]->(b:Entity {uri:trgUri}) relation
    createRelation: function (srcUri: string, relation: string, trgUri: string):Promise<any> {
        var params:Object = {
                srcUriLocal: srcUri,
                rel: relation,
                trgUriLocal: trgUri, 
            };
        return this.sendCypherResponse(cypherQueries.createRelation('srcUriLocal', 'rel', 'trgUriLocal'), params);
    },

    getNodeByParams: function(params:Object):Promise<any>{
        params = this.preparePropsNoKeyStrings(params);
        return this.sendCypherResponse(cypherQueries.getNodeByParams(params), params).then((
            function(results:any){
                return this.deleteKeyStrings(results);
        }).bind(this)
        );
    },

    deleteKeyStrings: function(TrNodes:Array<TraceNode>):Array<TraceNode>{
        TrNodes.forEach((function(item:TraceNode, index:number) {
            TrNodes[index] = this.deleteKeyString(item);
        }).bind(this));
        return TrNodes;
    },

  deleteKeyString: function(TrNode:TraceNode):any{
    var newNode:TraceNode = TrNode;
    for (var key in TrNode.node.properties){
        if (!key.match(".*" + this.getKeyKey("") + "$")){
            newNode.node.properties[TrNode.node.properties[this.getKeyKey(key)]] = TrNode.node.properties[key];
            if (!key.match(TrNode.node.properties[this.getKeyKey(key)])){
                delete newNode.node.properties[key];
            }
        }
    }
    for (var key in newNode.node.properties){
      if (key.match(".*" + this.getKeyKey("") + "$")){
        delete newNode.node.properties[key];
      }
    }
    return newNode;
  },

    prepareProps: function(props:any):any{
        var newProps:{"input": any} = {"input":{}};
        console.log("prparing props");
        for(var key in props){
            newProps["input"][this.getKeyOfProperty(key)] = props[key];
            newProps["input"][this.getKeyKey(key)] = key;
        }
        console.log(newProps["input"]);
        return newProps["input"];
    },
    preparePropsNoKeyStrings:function(props:string):string{
        var newProps:any = this.prepareProps(props);
        for(var key in newProps){
            if(key.match(".*" + this.getKeyKey("") + "$")){
                delete newProps[key];
            }
        }
        console.log(newProps);
        return newProps;    
    },
    getKeyOfProperty: function(key:string):string{
        var keyNoSpecialChar:string;
        if (key.match("rdf:about")){
            keyNoSpecialChar = "uri";
        }else{
            keyNoSpecialChar = key.replace(/[^a-zA-Z ]/g, "");
        }
        return keyNoSpecialChar;
    },
    getKeyKey:function(key:string):string{
        return  this.getKeyOfProperty(key)+"ThisIsTheKeyString";
    }
};
