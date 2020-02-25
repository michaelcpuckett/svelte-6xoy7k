// import jsonld from 'jsonld'
import '../node_modules/jsonld/dist/jsonld.js' 

class SHACL {
  async getConstraintComponent(type) {
    switch (type) {
      case 'property': return PropertyConstraintComponent
      case 'hasValue': return HasValueConstraintComponent
      case 'shClass': return ClassConstraintComponent
      case 'minCount': return MinCountConstraintComponent
      case 'maxCount': return MaxCountConstraintComponent
      case 'minLength': return MinLengthConstraintComponent
      case 'maxLength': return MaxLengthConstraintComponent
      case 'datatype': return DatatypeConstraintComponent
      case 'nodeKind': return NodeKindConstraintComponent
      default: return
    }
  }
  async getRuleComponent(type) {
    switch (type) {
      case 'property': return PropertyConstraintComponent
      case 'values': return ValuesComponent
      case 'rule': return RuleComponent
    }
    if (type.values) {
      return new ValuesComponent(type)
    }
  }
  async matchTargets(targets, $data) {
    if (targets.find(({ targetNode }) => targetNode)) {
      const targetNode = targets.find(({ targetNode }) => targetNode).targetNode.id
      return $data.filter(({ id }) => id === targetNode)
    }
    if (targets.find(({ targetClass }) => targetClass)) {
      const targetClass = targets.find(({ targetClass }) => targetClass).targetClass.id
      return $data.filter(({ type }) => type === targetClass)
    }
  }
  async getTargets({
    targetNode,
    targetClass,
    targetSubjectsOf,
    targetObjectsOf
  }) {
    return targetNode ?
      [{ targetNode }] :
      targetClass ?
        [{ targetClass }] :
        targetSubjectsOf ?
          [{ targetSubjectsOf }] :
          targetObjectsOf ?
            [{ targetObjectsOf }] :
            null
  }
  async getConstraintsByType({
    class: shClass,
    datatype,
    nodeKind,
    minCount,
    maxCount,
    minExclusive,
    minInclusive,
    maxExclusive,
    maxInclusive,
    minLength,
    maxLength,
    pattern,
    languageIn,
    uniqueLang,
    equals,
    disjoint,
    lessThan,
    lessThanOrEqualTo,
    not,
    and,
    or,
    xone,
    node,
    property,
    qualifiedValueShape,
    qualifiedMinCount,
    qualifiedMaxCount,
    hasValue,
    in: shIn
  }) {
    return [
      { shClass },
      { datatype },
      { nodeKind },
      { minCount },
      { maxCount },
      { minExclusive },
      { minInclusive },
      { maxExclusive },
      { maxInclusive },
      { minLength },
      { maxLength },
      { pattern },
      { languageIn },
      { uniqueLang },
      { equals },
      { disjoint },
      { lessThan },
      { lessThanOrEqualTo },
      { not },
      { and },
      { or },
      { xone },
      { node },
      { property },
      { qualifiedValueShape },
      { qualifiedMinCount },
      { qualifiedMaxCount },
      { hasValue },
      { shIn }
    ].filter(obj => Object.values(obj).find(_ => _))
  }
  async getRulesByType({
    values,
    rule,
    property,
  }) {
    return [
      { values },
      { rule },
      { property }
    ].filter(obj => Object.values(obj).find(_ => _))
  }
  async inferFromRule(type, rule, target, focusNode) {
    const Component = await this.getRuleComponent(type, focusNode)
    if (Component) {
      const component = Component._values ? Component : new Component(rule)
      return component.infer(target, focusNode)
    } else {
      console.log('NO COMPONENT FOUND')
    }
  }
  async validateConstraint(type, constraint, target, focusNode) {
    const component = new (await this.getConstraintComponent(type))(constraint)
    return component.validate(target, focusNode)
  }
  async inferShape(shape, data, focusNode) {
    const rulesByType = await this.getRulesByType(shape)
    return await this.getInferenceResult([data], rulesByType, focusNode)
  }
  async validateShape(shape, data, focusNode) {
    const constraintsByType = await this.getConstraintsByType(shape)
    return await this.getValidationResult([data], constraintsByType, focusNode)
  }
  async getInferenceResult(matchedTargets, rulesByType, focusNode) {
    return (rulesByType && rulesByType.length) ? (await Promise.all(matchedTargets.map(async target => {
      return await Promise.all(rulesByType.map(async rulesOfType => await Promise.all(Object.entries(rulesOfType).map(async ([ type, rules ]) => {
        if (type === 'property') {
          return await Promise.all((Array.isArray(rules) ? rules : [rules]).map(async rule => await this.inferFromRule(type, rule, target, (Array.isArray(focusNode.property) ? focusNode.property : [focusNode.property]).find(({ path }) => path.id === rule.path.id))))
        } else {
          return await this.inferFromRule(type, rules, target, focusNode)
        }
      }))))
    }))) : true
  }
  async getValidationResult(matchedTargets, constraintsByType, focusNode) {
    return (constraintsByType && constraintsByType.length) ? (await Promise.all(matchedTargets.map(async target => {
      return await Promise.all(constraintsByType.map(async constraintsOfType => await Promise.all(Object.entries(constraintsOfType).map(async ([ type, constraints ]) => {
        if (Array.isArray(constraints)) {
          return await Promise.all(constraints.map(async constraint => await this.validateConstraint(type, constraint, target, focusNode)))
        } else {
          return await this.validateConstraint(type, constraints, target, focusNode)
        }
      }))))
    }))) : true
  }
}

class ConstraintComponent extends SHACL {
  constructor(constraint) {
    super()
    this._constraint = constraint
  }
}

class PropertyConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async infer(target, focusNode) {
    if (this._constraint.path) {
      const nextTargets = typeof target[focusNode.path.id] === 'object' ? Array.isArray(target[focusNode.path.id]) ? target[focusNode.path.id] : [target[focusNode.path.id]] : [target]
      return await Promise.all(nextTargets.map(async target => await this.inferShape(this._constraint, target, focusNode)))
    } else {
      throw new Error('NO PATH')
    }
  }
  async validate(target) {
    const validationResult = await this.validateShape(this._constraint, target, this._constraint.path.id)
    return {
      component: this,
      target,
      validationResult: Array.isArray(validationResult) ? validationResult.flat(Infinity) : validationResult
    }
  }
}

class HasValueConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      validationResult: target[focusNode] === this._constraint
    }
  }
}

class ClassConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      validationResult: target.type === this._constraint.id
    }
  }
}

class MinCountConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      validationResult: (this._constraint === 1 && !Array.isArray(target[focusNode]) && (target[focusNode] || target[focusNode] !== false)) || (Array.isArray(target[focusNode]) && target[focusNode].length >= this._constraint)
    }
  }
}

class MaxCountConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      validationResult: Array.isArray(target[focusNode]) && (target[focusNode].length <= this._constraint)
    }
  }
}

class MinLengthConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      validationResult: typeof target[focusNode] === 'string' && target[focusNode].length >= this._constraint
    }
  }
}

class MaxLengthConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      validationResult: typeof target[focusNode] === 'string' && target[focusNode].length <= this._constraint
    }
  }
}

class DatatypeConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    return {
      component: this,
      validationResult: typeof target[focusNode] === this._constraint.id.split('../2001/XMLSchema#')[1]
    }
  }
}

class NodeKindConstraintComponent extends ConstraintComponent {
  constructor(constraint) {
    super(constraint)
  }
  async validate(target, focusNode) {
    const node = target[focusNode]
    const nodeKinds = {
      BlankNode: ['BlankNode'],
      IRI: ['NamedNode'],
      Literal: ['Literal'],
      BlankNodeOrIRI: ['BlankNode', 'NamedNode'],
      BlankNodeOrLiteral: ['BlankNode', 'Literal'],
      IRIOrLiteral: ['NamedNode', 'Literal']
    }
    return {
      component: this,
      validationValue: (() => {
        switch (true) {
          case (typeof node === 'string') && node.startsWith('http'): return 'NamedNode'
          case (typeof node === 'string') && node.startsWith('_:'): return 'BlankNode'
          case typeof node === 'string': return 'Literal'
          case (typeof target === 'object') && target.id && target.id.startsWith('http'): return 'NamedNode'
          case (typeof target === 'object') && target.id && target.id.startsWith('_:'): return 'BlankNode'
          case typeof target === 'object': return 'BlankNode'
          default: return 'Literal'
        }
      })(),
      validationResult: nodeKinds[this._constraint.id].includes((() => {
        switch (true) {
          case (typeof node === 'string') && node.startsWith('http'): return 'NamedNode'
          case (typeof node === 'string') && node.startsWith('_:'): return 'BlankNode'
          case typeof node === 'string': return 'Literal'
          case (typeof target === 'object') && target.id && target.id.startsWith('http'): return 'NamedNode'
          case (typeof target === 'object') && target.id && target.id.startsWith('_:'): return 'BlankNode'
          case typeof target === 'object': return 'BlankNode'
          default: return 'Literal'
        }
      })())
    }
  }
}

class RuleComponent {
  constructor(rule) {
    this._rule = rule
  }
  async infer(target) {
    const subject = this._rule.subject.id === 'this' ? target : target[this._rule.subject.path.id]
    if (!subject[this._rule.predicate.id]) {
      if (this._rule.object.path) {
        subject[this._rule.predicate.id] = subject[this._rule.object.path.id]
      } else {
        subject[this._rule.predicate.id] = this._rule.object
      }
    }
    return subject
  }
}

class ValuesComponent {
  constructor(values) {
    this._values = values
  }
  async infer(target, focusNode) {
    if (this._values.path) {
      target[focusNode.path.id] = target[this._values.path.id]
    } else {
      target[focusNode.path.id] = this._values
    }
    return target
  }
}

export class SHACLEngine extends SHACL {
  constructor(shapesGraph, dataGraph) {
    super()
    this.originalShapesGraph = shapesGraph
    this.originalDataGraph = dataGraph
  }
  async init() {
    const {
      "@graph": $data
    } = await jsonld.flatten(this.originalDataGraph, {
      "@context": {
        "id": "@id",
        "type": "@type"
      }
    }, {
      embed: true
    })

    const {
      "@graph": $shapes
    } = await jsonld.frame(this.originalShapesGraph, {
      "@context": {
        "@base": "http://www.w3.org/ns/shacl#",
        "@vocab": "http://www.w3.org/ns/shacl#",
        "id": "@id",
        "type": "@type"
      }
    }, {
      embed: true
    })

    this.$shapes = $shapes
    this.$data = $data
  }
  async infer() {
    const ruleOrders = [0]
    const results = await Promise.all(ruleOrders.map(async ruleOrder => await this.getInferenceResults(ruleOrder)))

    const {
      "@graph": inferredGraph
    } = await jsonld.frame({
      "@context": {
        "id": "@id",
        "type": "@type"
      },
      "@graph": results
    }, {
      "@context": {
        "id": "@id",
        "type": "@type"
      }
    }, {
      embed: true
    })
    this.inferredGraph = await jsonld.frame({
      "@context": {
        "id": "@id",
        "type": "@type"
      },
      "@graph": inferredGraph
    }, {
      "@context": {
        ...this.originalDataGraph["@context"]
      }
    }, {
      embed: true
    })
    return inferredGraph
  }
  async validate() {
    const report = await this.getValidationResults()
    const conforms = report ? !report.find(result => result !== true) : true

    this.validationReport = {
      conforms,
      report
    }

    return this.validationReport
  }
  async getValidationResults() {
    const nodesWithTargets = (await Promise.all(this.$shapes.map(async node => [await this.getTargets(node), node]))).map(([hasTargets, node]) => hasTargets ? node : null).filter(_ => _)
    return await Promise.all(nodesWithTargets.map(async node => {
      const targets = await this.getTargets(node)
      const matchedTargets = await this.matchTargets(targets, this.$data)
      const constraintsByType = await this.getConstraintsByType(node)
      return (await this.getValidationResult(matchedTargets, constraintsByType, node))
    }))
  }
  async getInferenceResults(order) {
    const nodesWithTargets = (await Promise.all(this.$shapes.map(async node => [await this.getTargets(node), node]))).map(([hasTargets, node]) => hasTargets ? node : null).filter(_ => _)
    return await Promise.all(nodesWithTargets.map(async node => {
      const targets = await this.getTargets(node)
      const matchedTargets = await this.matchTargets(targets, JSON.parse(JSON.stringify(this.$data)))
      const rulesByType = await this.getRulesByType(node)
      return await this.getInferenceResult(matchedTargets, rulesByType, node, order)
    }))
  }
}