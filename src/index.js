import { SHACLEngine } from './Engine.js'

const exampleDataGraph = {
  "@context": {
    "@base": "http://schema.org/",
    "@vocab": "http://schema.org/"
  },
  "@graph": [{
    "@id": "zuko",
    "@type": "Person",
    "givenName": "Zuko",
    "familyName": "OK"
  }, {
    "@type": "Person",
    "givenName": "Alice",
    "lastName": "LAST NAME",
    "knows": [{
      "@type": "Person",
      "givenName": "Bob",
      "familyName": "Rodriguez"
    }, {
      "@type": "Agent",
      "givenName": "Carol",
      "lastName": "Durveuax"
    }, {
      "@id": "zuko"
    }]
  }]
}

const exampleShapesGraph = {
  "@context": {
    "@base": "http://www.w3.org/ns/shacl#",
    "@vocab": "http://www.w3.org/ns/shacl#",
    "schema": "http://schema.org/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "type": "@type",
    "targetClass": { "@type": "@id" },
    "path": { "@type": "@id" },
    "class": { "@type": "@id" },
    "datatype": { "@type": "@id" },
    "nodeKind": { "@type": "@id" },
    "subject": { "@type": "@id" },
    "predicate": { "@type": "@id" }
  },
  "@graph": [{
    "type": "NodeShape",
    "targetClass": "schema:Agent",
    "property": {
      "path": "schema:foo",
      "values": "bar"
    }
  }, {
    "type": "NodeShape",
    "targetClass": "schema:Person",
    // "rule": {
    //   "subject": "this",
    //   "predicate": "schema:hello",
    //   "object": "(rule on person)"
    // },
    "property": [{
      "type": "PropertyShape",
      "path": "schema:givenName",
      "values": "Alice"
    }, {
      "type": "PropertyShape",
      "path": "schema:familyName",
      "values": { "path": "schema:lastName" }
    }, {
      "type": "PropertyShape",
      "path": "schema:knows",
      "class": "schema:Person",
      "property": [{
        "path": "schema:test",
        "values": {
          "path": "schema:givenName"
        }
      }]
    }]
  }]
}

;(async () => {
  const engine = new SHACLEngine(exampleShapesGraph, exampleDataGraph)
  await engine.init()
  await engine.infer()
  await engine.validate()
  console.log(engine.validationReport)
  console.log(engine.inferredGraph)
})()