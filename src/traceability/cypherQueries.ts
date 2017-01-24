///<reference path="../../typings/browser.d.ts"/>

module.exports = {

    getNodeByParams: function (nodeParams: Object):string{
        return 'MATCH (node {' + getPropertyString(nodeParams) + '}) RETURN node';
    },
    createRelation: function (scrUriName:string, relationName:string, trgUriName:string):string{
        return 'MATCH (s {uri: {' + scrUriName + '}}),(t {uri: {' + trgUriName + '}}) \
        CREATE (s)-[r:Trace {name: {' + relationName + '}}]->(t) \
        RETURN s,r,t';
    },
    getRelation:function (scrUriName:string, relationName:string, trgUriName:string):string{
        return 'MATCH (s {uri: {' + scrUriName + '}})-[r:Trace {name: {' + relationName + '}}]->(t {uri: {' + trgUriName + '}}) RETURN r';
    },
    getRelationsTo:function (uriName:string):string{
        return 'MATCH (s)-[r:Trace]->(t {uri: {' + uriName + '}}) RETURN s,r,t';
    },
    getRelationsFrom:function (uriName:string):string{
        return 'MATCH (s {uri: {' + uriName + '}})-[r:Trace]->(t) RETURN s,r,t';
    },
    storeNode:function(properties:Object, specifier:string){
        return 'CREATE (node:' + specifier + ' {' + getPropertyString(properties) + '}) RETURN node';
    },
    getNodeByUri:function(uriName:string):string{
        return 'MATCH (node {uri: {' + uriName + '}}) RETURN node';
    },
    modifyNode:function(properties:Object, uriName:string):string{
        var queryString:string = 'MERGE (n {uri: {' + uriName + '}}) ON MATCH SET ';
        for (var key in properties){
            queryString = queryString +  'n.' + key + '= {' + key + '}, ';
        }
        return queryString.substring(0, queryString.length - 2);
    }
}

function getPropertyString(params:Object):string{
    var propertyString = '';
    for (var key in params){
        propertyString = propertyString +  key + ': {' + key + '}, ';
    }
    return propertyString.substring(0, propertyString.length - 2);
}