module.exports = model => {
    const typX = (type, isNullable) => `${type}${isNullable ? '' : '!'}`

    const { type, typePlural, field, fieldPlural, pkName, fields } = model
    const pkType = pkName && fields[pkName].type

    if (model.type === 'User') {
        console.log('model', model)
    }

    let fields1 = Object.keys(fields)
        .map(f => fields[f])
        .map(f => `${f.name}: ${typX(f.type, f.isNullable)}`)
    model.references.forEach(f => fields1.push(`${f.field}: ${f.model.type}`))
    model.listReferences.forEach(f => fields1.push(`${f.model.fieldPlural}: [${f.model.type}]`))
    fields1 = fields1.join('\n    ')

    const fields2 = Object.keys(fields)
        .map(f => fields[f])
        .map(f => `${f.name}: ${typX(f.type, f.isNullable)}`)
        .join(', ')

    const fields3 = Object.keys(fields)
        .map(f => fields[f])
        .map(f => `${f.name}: ${f.type}`)
        .join(', ')

    const typeDefJS = `export default
\`  type ${type} {
    ${fields1}
  }

  type Query {
    ${field}(${fields3}): ${type}
    ${fieldPlural}: [${type}]
  }

  type Mutation {
    add${type}(${fields2}): ${type}
    edit${type}(${fields3}): ${type}
    delete${type}(${fields3}): ConfirmDeleteKey
  }
\``

    return typeDefJS
}
