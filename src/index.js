import { SHACLEngine } from './Engine.js'

const exampleDataGraph = {
  "@context": {
    "@base": "http://schema.org/",
    "@vocab": "http://schema.org/",
    "id": "@id",
    "type": "@type"
  },
  "@graph": [{
    "id": "zuko",
    "type": "Agent",
    "givenName": "Zuko",
    "lastName": "Skywalker"
  }, {
    "id": "alice",
    "type": "Person",
    "givenName": "Alice",
    "lastName": "BAD LAST NAME",
    "knows": [{
      "id": "bob",
      "type": "Person",
      "givenName": "Bob",
      "familyName": "Rodriguez"
    }, {
      "id": "carol",
      "type": "Agent",
      "givenName": "Carol",
      "lastName": "TEST"
    }, {
      "id": "ang",
      "type": "Agent",
      "givenName": "Ang",
      "lastName": "Lee"
    }, {
      "id": "zuko"
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
    "property": [{
      "path": "schema:wow",
      "values": "!"
    }]
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
      "path": "schema:givenName"
    }, {
      "type": "PropertyShape",
      "path": "schema:familyName",
      "values": { "path": "schema:lastName" }
    }, , {
      "type": "PropertyShape",
      "path": "schema:knows",
      "class": "schema:Person",
      "minCount": 1,
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
  // console.log(engine.validationReport)
  // console.log(engine.$data)
  console.log(engine.inferredGraph)
})()