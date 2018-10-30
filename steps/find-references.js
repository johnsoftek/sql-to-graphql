'use strict';

var filter = require('lodash/filter');
var find = require('lodash/find');
var snakeCase = require('lodash/snakeCase');
var camelCase = require('lodash/camelCase');
var capitalize = require('lodash/capitalize');

function findReferences(models, opts) {
    for (var type in models) {
        models[type].references =
            opts.rel === 'colids' ? findReferencesForModelByID(models[type], models) :
            opts.rel === 'backend' ? findReferencesForModelBackend(models[type], models) :
            [];
        models[type].listReferences = [];
    }

    return models;
}

function findReferencesForModelByID(model, models) {
    // Find columns that end with "Id"
    var refs = filter(model.fields, isIdColumn);
    var fields = Object.keys(model.fields);

    // Filter the columns that have a corresponding model
    return refs.reduce(function(references, col) {
        var colName = col.name.substr(0, col.name.length - 2).replace(/^parent/, '');
        var parts = snakeCase(colName).split('_'), fieldName;

        do {
            var name = parts.map(capitalize).join('');

            // Do we have a match for this?
            if (models[name]) {
                fieldName = col.name.replace(/Id$/, '');

                // If we collide with a different field name, add a "Ref"-suffix
                if (fields.indexOf(fieldName) !== -1) {
                    fieldName += 'Ref';
                }

                references.push({
                    model: models[name],
                    field: fieldName,
                    refField: col.name
                });

                return references;
            }

            parts.shift();
        } while (parts.length > 0);

        return references;
    }, []);
}

function isIdColumn(col) {
    return !col.isPrimaryKey && col.name.substr(-2) === 'Id';
}

function findReferencesForModelBackend(model, models) {
    var refs = filter(model.fields, isForeignKeyColumn);
    var fields = Object.keys(model.fields);

    // Filter the columns that have a corresponding model
    return refs.reduce(function(references, col) {
        // Ensure referenced table is in the model list
        var refModel 
        if (refModel = find(models, {table: col.refTableName})) {
            var fieldName = camelCase(refModel.name);

            // If we collide with a different field name, add a "Ref"-suffix
            if (fields.indexOf(fieldName) !== -1) {
                fieldName += 'Ref';
            }

            // Ensure table has primary key
            // Does not handle multi-column keys
            if (find(model.fields, { isPrimaryKey: true })) {
              references.push({
                  model: refModel,
                  field: fieldName,
                  refField: col.name
              });
            }

        }

        return references;
    }, []);
}

function isForeignKeyColumn(col) {
    return !!col.refTableName;
}

module.exports = findReferences;
