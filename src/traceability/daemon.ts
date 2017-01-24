///<reference path="../../typings/browser.d.ts"/>

// for REST services
import restify = require('restify');
// concurrency
import Promise = require("bluebird");
// xml handling
import xml2js = require('xml2js');
 
// var neo4j = require('neo4j'); 

/**
 * Trace
 */
class Trace {
  constructor(source: TraceNode, relation: string, target: TraceNode) {
    this.source = source; 
    this.relation = relation;
    this.target = target;
  }
  source: TraceNode;
  relation: string;
  target: TraceNode;
}

import {TraceNode, TraceNodeBase, TraceRel, TraceRelProps, TraceLink} from './db';

export class Daemon {
  public isconnected:boolean;
  private db:any;
  public port:number;
  private neo4jURL:string;

  constructor(){
    this.isconnected = false;
  }
  public start(serverPort:number, allreadyInUseCallback:Function, setPortCallback:Function){
    this.db = require('./db');

    try {
      var server = restify.createServer({
        name: 'INTO-CPS-Traceability-Daemon' 
      });

      server.on('error', function(err:any){
        if (err.errno=== 'EADDRINUSE'){
          allreadyInUseCallback();
        }else{
          throw(err);
        }
      });

      server.use(restify.bodyParser());
      server.use(restify.queryParser({ mapParams: false }));

      // ------- REST URLs: --------
      server.post('/traces/push/json', (this.handlePostJSON).bind(this));
      server.get('/traces/from/:source/json', (this.handleGETTraceFromJSON).bind(this));
      server.get('/traces/to/:target/json', (this.handleGETTraceToJSON).bind(this));
      server.get('/nodes/json', (this.handleGETNodeToJSON).bind(this));
    
      server.post('/traces/push/xml', (this.handlePostXML).bind(this));
      server.get('/traces/from/:source/xml', (this.handleGETTraceFromXML).bind(this));
      server.get('/traces/to/:target/xml', (this.handleGETTraceToXML).bind(this));

      server.get('/database/cypher/:query/json', (this.handleCypherQuery).bind(this)); 
     
    //  server.get('/traces/test/methods', handleTestMethods);

      server.get(new RegExp('^\/test\/(.+)\/json'), (this.handleMatch).bind(this));

      server.listen(serverPort, (function(localSetPortCallback:Function) {
            console.log('Traceability daemon listening on port %s.', server.address().port);
            this.port = server.address().port;
            localSetPortCallback(server.address().port);
      }).bind(this, setPortCallback));
    } catch (err) {
      console.log(err.message);
      console.log(err.stack); 
    }
 
  }

  public connect(neo4jURL:string, errorCallback:Function){
      if (!neo4jURL){
          neo4jURL = this.neo4jURL;
      }
      this.neo4jURL = neo4jURL;

      try{
        this.db.connect(neo4jURL);
      }catch(err){
        console.log(err.message);
        console.log(err.stack);
        this.isconnected = false;
      }

      this.isconnected = true;

      this.db.testConnection()
        .catch((function (err: Error) {
            errorCallback(err);
            this.isconnected = false;
        }).bind(this));
  }

  // ------- functions ---------

  private sendUnconnectedMessage(resp: restify.Response){
    resp.send(503, "Unable to perform action. Daemon is not connected to neo4J."); 
    return;
  }

  private handleCypherQuery(req: restify.Request, resp: restify.Response, next: restify.Next){
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("Cypher request received:");
    var cypherQuery:string=req.params.query;
    var cypherParams = req.query;
    this.db.sendCypherResponse(cypherQuery, cypherParams).then(function (results: any) {
      resp.send(results);
    }).catch(this.reportError(resp, 500));
    return next();
  }

  private handleMatch(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    resp.send(req.params[0] + " matched!")
    return next();
  }
  private handleGETTraceFromJSON(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("GET request received:");
    this.db.getRelationsFrom(req.params.source).then((function (results: TraceLink[]) {
      resp.send(this.toRdfJson(this.toTriples(results)));
    }).bind(this)).catch(this.reportError(resp, 500));
    return next();
  }

  private handleGETTraceFromXML(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("GET request received:");
    this.db.getRelationsFrom(req.params.source).then((function (results: TraceLink[]) {
      resp.send(this.toRdfXml(this.toTriples(results)));
    }).bind(this)).catch(this.reportError(resp, 500));
    return next();
  }

  private handleGETTraceToJSON(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("GET request received:");
    this.db.getRelationsTo(req.params.target).then((function (results: TraceLink[]) {
      resp.send(this.toRdfJson(this.toTriples(results)));
    }).bind(this)).catch(this.reportError(resp, 500));
    return next();
  }

  private handleGETNodeToJSON(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("GET request received:");
    this.db.getNodeByParams(req.query).then(function (results: any) {
      resp.send(results);
    }).catch(this.reportError(resp, 500));
    return next();
  }

  private handleGETTraceToXML(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("GET request received:");
    this.db.getRelationsTo(req.params.target).then((function (results: TraceLink[]) {
      resp.send(this.toRdfXml(this.toTriples(results)));
    }).bind(this)).catch(this.reportError(resp, 500));
    return next();
  }
  private handlePostJSON(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("POST request received:");
    if (req.is('application/json')) {
      console.log("The content type is 'application/json'"); 
      var jsonObj = req.body; 
      this.storeObject(jsonObj, resp).catch(this.reportError(resp, 500));
    }
    else {
      resp.status(400);
      resp.send("Invalid JSON data.");
    }
    return next();
  }

  private handlePostXML(req: restify.Request, resp: restify.Response, next: restify.Next) {
    if (!this.isconnected){
      this.sendUnconnectedMessage(resp);
      return next();
    }
    console.log("POST request received:");
    try {
      this.toJson(req.body, (function cb(err: Error, obj: Object) {
        if (err) throw err;
        this.storeObject(obj, resp).catch(this.reportError(resp, 500));
      }).bind(this));
    } catch (err) {
      resp.status(500);
      resp.send(err.message);
    }
    return next();
  }

  private reformat(old : any) {
    var newObj :any = {};
    var tmp :any = old["prov:Entity"];
    newObj["rdf:about"] = tmp.$["rdf:about"];
    delete tmp.$;
    for (var field in tmp) {
      newObj[field] = tmp[field];
    }
    return newObj;
  }


  // stores the data object
  private storeObject(jsonObj: Object, resp: restify.Response):Promise<any> {
      var pr:Promise<any> = this.recordTrace(jsonObj);
      pr.then(function () {
        resp.send("POST request received.");
      }).catch(this.reportError(resp, 500)); 
      return pr;
  }

  public recordTrace(jsonObj: Object):Promise<any>{
      var objArray : Object[];
      if (!Array.isArray(jsonObj)) {
        objArray = [jsonObj];
      }
      else { 
        objArray = jsonObj;
      }
      var pr:Promise<any> = Promise.resolve(undefined);
      for (var index in objArray) {
        var obj :any = objArray[index];
        if ((<Object>obj).hasOwnProperty("$")) {
          // if data comes from xml parser the object needs to be reformatted
          obj = this.reformat(obj);
        }
        pr = pr.return(obj).then((function (localObj:any){return this.parseSubject(localObj, "");}).bind(this));
      }
      return pr;
    
  }

  private isNode(obj: any){
    for(var key in obj){
      var value = obj[key];
      if(typeof value === "string"){
        if(key === "rdf:about"){
          return  true;
        }
      }
    }
    return false; 
  } 


  private getNode(obj: any, specifier: string): TraceNode{
    var targetObj:TraceNode = {
      node: {
        properties:{
          uri: obj["rdf:about"],
          specifier: specifier,
        },
        labels: new Array(0),
        _id: ""
      }
    }
    for(var key in obj){
      if(typeof obj[key] === "string"){
        if(!(key==="rdf:about")){
          targetObj.node.properties[key] = obj[key];
        }
      }
    }
    return targetObj; 
  }
  private isRelation(relation: any) {
      return !this.isString(relation);
  }
  private isString(jsonObj: any){
      if (typeof jsonObj === "string") {
          return true;
      }
      return false;
  }

  private isArray(array: any){
    if (array.constructor == Array){
      return true;
    }
    return false;
  }
  private storeNode(node: TraceNode): Promise<any>{ 
    return this.db.existsNode(node.node.properties.uri)
      .then((function(existsNode:boolean){
        if (!existsNode){
            return this.db.storeNode(node);
        } else { 
            return this.db.modifyNode(node);
        }
      }).bind(this));
  }

  private parseSubject(jsonObj: any, type: string): Promise<any>{
    var pr:Promise<any> = Promise.resolve(undefined);
    if (this.isNode(jsonObj)) {
          var subject = this.getNode(jsonObj, type);
          pr = this.storeNode(subject);
          for(var key in jsonObj){
            pr = pr.return(key).then((function(localKey:any) {return this.parseRelation(subject, jsonObj[localKey], localKey)}).bind(this));
          }
    }else if(this.isArray(jsonObj)){
          for (let value of jsonObj){
              pr = pr.return(value).then((function(localValue:any) {return this.parseSubject(localValue, type)}).bind(this));
          }
    }else if (!this.isString(jsonObj)){
          for (var key in jsonObj){
              pr = pr.return(key).then((function (localKey:string) {
                  return this.parseSubject(jsonObj[localKey], localKey);
              }).bind(this));
          }
    }
    return pr;
  }

  private parseRelation(subject: TraceNode, jsonObj: any, type: string):Promise<any>{
    var pr:Promise<any> = Promise.resolve(undefined);
    if(this.isArray(jsonObj)){
      for(let arrayValue of jsonObj){
        pr = pr.return(arrayValue).then((function(localValue:any) {return this.parseRelation(subject, localValue, type)}).bind(this));
      }
    }else{
      for (var key in jsonObj){
        if (this.isNode(jsonObj[key]) || this.isArray(jsonObj[key])){
          pr = pr.return(key).then((function(localKey:any) {return this.parseObject(subject, type, jsonObj[localKey], localKey)}).bind(this));
        }
      }
    }
    return pr;
  }
  private parseObject(subject: TraceNode, relation: string, jsonObj:any, type: string):Promise<any>{
    var pr:Promise<any> = Promise.resolve(undefined);
    if (this.isNode(jsonObj)){
      var object:TraceNode = this.getNode(jsonObj, type);
      pr = this.parseSubject(jsonObj, type);
      pr = pr.then((function() {return this.storeSingleObject(subject, relation, object)}).bind(this));
    }else if(this.isArray(jsonObj)){
      for(let arrayValue of jsonObj){
        pr = pr.return(arrayValue).then((function(localValue:any) {return this.parseObject(subject, relation, localValue, type)}).bind(this));
      }
    }
    return pr;
  }


  private storeSingleObject(sub: TraceNode, pred: string, obj: TraceNode):Promise<any>{
    return this.storeTriple(new Trace(sub, pred, obj));
  }

  //function storeTriple(triple: Trace, resp: restify.Response) {
  private storeTriple(triple: Trace):Promise<any> {
    return this.storeNode(triple.source)
      // insert target node if not yet contained
    .then((function() { return this.storeNode(triple.target)}).bind(this))
      // insert relation if not yet contained
  .then((function() {
    return this.db.existsRelation(triple.source.node.properties.uri, triple.relation, triple.target.node.properties.uri)
    .then((function(relationExists: boolean){
      if (!relationExists){
        return this.db.createRelation(triple.source.node.properties.uri, triple.relation, triple.target.node.properties.uri);
      }else{
        return Promise.resolve(undefined);
      }
    }).bind(this));
    }).bind(this));
  }

  // returns an error reporting function 
  private reportError(resp: restify.Response, error: number) {
    return function (err: Error) {
      resp.status(error);
      resp.send(err.message);
      console.log(err.message);
      console.log(err.stack);
    }
  }

  // generates array of Trace objects from TraceLink array
  private toTriples(answer: TraceLink[]) {
    var triples: Trace[] = [];
    for (let trace of answer) {
      var triple: Trace = new Trace({node: trace.s}, trace.r.properties.name, {node: trace.t});
      triples.push(triple);
    }
    return triples;
  }

  // translates array of Trace objects to an RDF/JSON object
  private toRdfJson(triples: Trace[]) {
    var rdfObjects: Object[] = [];
    for (let triple of triples) {
      rdfObjects.push(this.toObject(triple));
    }
    return rdfObjects;
  }
  private toObject(triple: Trace): Object{
    var targetSpecifier: string = triple.target.node.properties.specifier;
    var sourceSpecifier: string = triple.source.node.properties.specifier;
    delete triple.source.node.properties.specifier;    
    delete triple.target.node.properties.specifier;
    var obj: {"rdf:RDF": any} = {
      "rdf:RDF": { 
        "prov": "http://www.w3.org/ns/prov#", 
        "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
        [sourceSpecifier]: {
          "rdf:about" : triple.source.node.properties.uri, 
          [triple.relation]:{
            [targetSpecifier]:{
              "rdf:about" : triple.target.node.properties.uri
            } 
          }
        }
      }
    };
    delete triple.source.node.properties.uri;    
    delete triple.target.node.properties.uri;
    for (var key in triple.source.node.properties){
      if (!key.match(".*" + this.db.getKeyKey("") + "$")){
        obj["rdf:RDF"][sourceSpecifier][this.db.getKeyKey(key)] = triple.source.node.properties[key];
      }
    }
    for (var key in triple.target.node.properties){
      if (!key.match(".*" + this.db.getKeyKey("") + "$")){
        obj["rdf:RDF"][sourceSpecifier][triple.relation][targetSpecifier][this.db.getKeyKey(key)] = triple.target.node.properties[key];
      }
    }
    return obj;
  }

  // translates array of Trace objects to an RDF/XML object
  private toRdfXml(triples: Trace[]) {
    var rdfObjects: Object[] = [];
    var builder = new xml2js.Builder({ headless: true }); 
    for (let triple of triples) {
      rdfObjects.push(builder.buildObject(this.toObject(triple)));
    }
    return rdfObjects;
  }
  
  private toJson(xml: string, cb: Function) {
    var parser = new xml2js.Parser({ explicitArray: false, explicitRoot: false });
    parser.parseString(xml, cb);

  }
}