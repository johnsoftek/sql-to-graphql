const _camelCase = require('lodash/camelCase')
const _pick = require('lodash/pick')

module.exports = (model, models) => {
    const { type, typePlural, field, fieldPlural, tableName, pkName, fields } = model

    const imports = []
    const getRefs = []
    const findOneImports = {}
    const findImports = {}
    
    model.references.forEach(ref => {
        const { field, refField, fieldAlias } = ref
        const type = ref.model.type

        if (!findOneImports[type]) {
            findOneImports[type] = true
            imports.push(`import {findOne${type}} from './${type}'`)
        }

        getRefs.push(`refField = selections.find(f => f.kind === 'Field' && f.name.value === '${fieldAlias}')
    if (refField) {
      row.${field} = findOne${type}({ ${
            ref.model.pkName
        }: row['${refField}'] }, refField.selectionSet.selections)
    }
`)
    })

    model.listReferences.forEach(ref => {
        const { fieldPlural, typePlural, type } = ref.model

        if (!findImports[type]) {
            findImports[type] = true
            imports.push(`import {find${typePlural}} from './${type}'`)
        }

        getRefs.push(
            `refField = selections.find(f => f.kind === 'Field' && f.name.value === '${ref.field}')
 if (refField) {
      row.${ref.field} = find${typePlural}({ ${ref.refField}: row['${
                ref.model.pkName
            }'] }, refField.selectionSet.selections)
    }
`
        )
    })

    const resolverDefJS = `
import _pick from 'lodash/pick'
import { findOne, find, create, findOneAndUpdate, findOneAndDelete } from '../../knex/operations'

// Repeat for relations
${imports.join('\n')}

const bridge = {
  type: '${type}',
  fieldName: '${field}',
  tableName: '${tableName}',
  fieldColumnMap: {
    ${Object.keys(fields)
        .map(f => fields[f])
        .map(f => `'${f.name}': '${f.originalName}'`)
        .join(',\n    ')}
  },
  pkField: '${pkName}'
}

const resolveRefs = (row, selections) => {
  let refField
  ${getRefs.join('\n')}
  return row
}

// The ${type} resolver.
export const findOne${type} = (args, selections) =>
  findOne(bridge, args)  ${getRefs.length === 0 ? '/*' : ''}
.then(row => resolveRefs(row, selections))${getRefs.length === 0 ? '*/' : ''}

export const find${typePlural} = (args, selections) =>
  find(bridge, args)  ${getRefs.length === 0 ? '/*' : ''}
  .then(rows => {
    rows.forEach(
      row => resolveRefs(row, selections)
    )
    // Could restrict to selected fields but GraphQL will do so anyway
    return rows
})${getRefs.length === 0 ? '*/' : ''}

export default {
  Query: {
    ${field}: (parent, args, context, info) =>
    findOne${type}(args, info.fieldNodes[0].selectionSet.selections),
    ${fieldPlural}: (parent, args, context, info) =>
    find${typePlural}(args, info.fieldNodes[0].selectionSet.selections)
  },
  Mutation: {
    add${type}: (parent, args, context, info) => create(bridge, args),
    edit${type}: (parent, args, context, info) => findOneAndUpdate(bridge, args),
    delete${type}: (parent, args, context, info) => findOneAndDelete(bridge, args)
  }
}

`
    return resolverDefJS
}
