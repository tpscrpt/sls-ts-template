#!/usr/bin/env node
const yaml = require("js-yaml")

// string utils
// Used for some resources which have capitalized names
function _capitalizeFirst(name) {
    const splits = name.split('')
    splits[0] = splits[0].toUpperCase()
    return splits.join('')
}

// Used throughout to perform interpolation on templates
String.prototype.replaceAll = function(pattern, val) {
    const str = this.valueOf()
    return str.replace(new RegExp(pattern, 'g'), val)
}

// These Type's and the Schema are required for js-yaml not to complain
const getAttType = new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct(data) {
        return `!GetAtt ${data}`
    }
})
const refType = new yaml.Type('!Ref', {
    kind: 'scalar',
    construct(data) {
        return `!Ref ${data}`
    }
})
const slsSchema = yaml.Schema.create([refType, getAttType])

const alphanumeric = /^[a-z0-9]+$/i

// TODO: Better help message and formatting info (yargs API docs)
// main script
require("yargs")
    .command("new-function <name>", 'create a new function', (yargs) => {
        yargs.positional("name", {
            describe: "name of the new function",
            coerce: (name) => {
                if (!alphanumeric.test(name)) throw "Function name must be alphanumeric"
                return name
            }
        })
        yargs.option("path", {
            type: "string",
            decribe: "api endpoint for this function (default function name). Format: <path>[/:param1[/:param2...]]",
            alias: "p",
            default: undefined
        })
        yargs.option("method", {
            type: "string",
            describe: "http method to use for the function",
            choices: ["get", "post", "put", "delete", "patch"],
            alias: "m",
            default: "post"
        })
    }, argv => {
        newFunction(argv)
    })
    .command("new-table <name>", 'create a new table', (yargs) => {
        yargs.positional("name", {
            describe: "name of the new table",
            coerce: (name) => {
                if (!alphanumeric.test(name)) throw "Table name must be alphanumeric"
                return name
            }
        })
        yargs.option("primaryKey", {
            type: "string",
            describe: "name and type of the primary key of the table. Format: name,type. e.g. email,S",
            alias: "pk",
            default: "resourceId,S"
        })
        yargs.option("secondaryKey", {
            type: "string",
            describe: "name and type of the secondary key of the table. Format: name,type. e.g. timestamp,N",
            alias: "sk",
            default: undefined
        })
        yargs.option("timeToLive", {
            type: "string",
            describe: "name of the TimeToLiveSpecification field of the table",
            alias: "ttl",
            default: undefined
        })
        yargs.option("getItem", {
            type: "array",
            describe: "creates a getItem policy for this table; you must provide a list of function names",
            alias: "g",
            coerce: (functionNames) => {
                if (!functionNames.length) throw "Must pass the name of at least 1 function which can use this policy"
                return functionNames
            }
        })
        yargs.option("putItem", {
            type: "array",
            describe: "creates a putItem policy for this table; you must provide a list of function names",
            alias: "p",
            coerce: (functionNames) => {
                if (!functionNames.length) throw "Must pass the name of at least 1 function which can use this policy"
                return functionNames
            }
        })
        yargs.option("updateItem", {
            type: "array",
            describe: "creates a updateItem policy for this table; you must provide a list of function names",
            alias: "u",
            coerce: (functionNames) => {
                if (!functionNames.length) throw "Must pass the name of at least 1 function which can use this policy"
                return functionNames
            }
        })
        yargs.option("deleteItem", {
            type: "array",
            describe: "creates a deleteItem policy for this table; you must provide a list of function names",
            alias: "d",
            coerce: (functionNames) => {
                if (!functionNames.length) throw "Must pass the name of at least 1 function which can use this policy"
                return functionNames
            }
        })
        yargs.option("query", {
            type: "array",
            describe: "creates a query policy for this table; you must provide a list of function names",
            alias: "q",
            coerce: (functionNames) => {
                if (!functionNames.length) throw "Must pass the name of at least 1 function which can use this policy"
                return functionNames
            }
        })
        yargs.option("scan", {
            type: "array",
            describe: "creates a scan policy for this table; you must provide a list of function names",
            aslas: "s",
            coerce: (functionNames) => {
                if (!functionNames.length) throw "Must pass the name of at least 1 function which can use this policy"
                return functionNames
            }
        })
        yargs.option("readCapacityUnits", {
            type: 'number',
            describe: "number of ReadCapacityUnits to reserve for this table",
            alias: "rcu",
            default: 3
        })
        yargs.option("writeCapacityUnits", {
            type: 'number',
            describe: "number of WriteCapacityUnits to reserve for this table",
            alias: "wcu",
            default: 1
        })
        yargs.option("tags", {
            type: "array",
            describe: "tags to apply to the table, format: \"key1=value1\" \"key2=value2\"",
            alias: "t"
        })
    }, argv => {
        newTable(argv)
    }).argv

async function newFunction({ name, method, path: _path }) {
    const path = require("path")
    const fs = require("fs")

    const projectRootPath = path.join(__dirname, '../')
    const functionFolderPath = path.join(projectRootPath, `./src/functions/${name}`)
    const templatesPath = path.join(projectRootPath, './templates/function')

    // create function folder
    fs.mkdirSync(functionFolderPath)

    await Promise.all([
        new Promise((resolve) => {
            // write function's index.yml file
            const functionIndexYmlPath = path.join(functionFolderPath, './index.yml')
            const functionIndexYmlTemplatePath = path.join(templatesPath, './index.yml')
            fs.writeFileSync(functionIndexYmlPath,
                fs.readFileSync(functionIndexYmlTemplatePath).toString()
                    .replaceAll('{{name}}', name)
                    .replaceAll('{{name.capitalizeFirst}}', _capitalizeFirst(name))
                    .replaceAll('{{method}}', method)
                    .replaceAll('{{path}}', _path || name)
            )
            resolve()
        }),

        new Promise((resolve) => {
            // write function's role file
            const functionRoleYmlPath = path.join(functionFolderPath, './role.yml')
            const functionRoleYmlTemplatePath = path.join(templatesPath, './role.yml')
            fs.writeFileSync(functionRoleYmlPath,
                fs.readFileSync(functionRoleYmlTemplatePath).toString()
                    .replaceAll('{{name.capitalizeFirst}}', _capitalizeFirst(name))
            )
            resolve()
        }),

        new Promise((resolve) => {
            // write function's basic package.json file
            const functionPackageJsonPath = path.join(functionFolderPath, './package.json')
            const functionPackageJsonTemplatePath = path.join(templatesPath, './package.json')
            fs.writeFileSync(functionPackageJsonPath,
                fs.readFileSync(functionPackageJsonTemplatePath).toString()
                    .replaceAll('{{name}}', name)
            )
            resolve()
        }),

        new Promise((resolve) => {
            // write function's handler
            const functionIndexTsPath = path.join(functionFolderPath, './index.ts')
            const functionIndexTsTemplatePath = path.join(templatesPath, './index.txt')
            fs.writeFileSync(functionIndexTsPath,
                fs.readFileSync(functionIndexTsTemplatePath).toString()
                    .replaceAll('{{name.capitalizeFirst}}', _capitalizeFirst(name))
            )
            resolve()
        }),
    ])


    // modify cloudwatch policy to include the new function role so it can log
    const cloudwatchYmlPath = path.join(projectRootPath, './src/policies/cloudwatch.yml')
    const cloudwatch = yaml.safeLoad(fs.readFileSync(cloudwatchYmlPath).toString(), { schema: slsSchema })
    const Properties = cloudwatch.Resources.StandardLambdaCloudwatchPolicy.Properties
    if (!Properties.Roles) Properties.Roles = []
    Properties.Roles.push(`!Ref ${_capitalizeFirst(name)}Role`)
    const cloudwatchYml = yaml.safeDump(cloudwatch, { schema: slsSchema })
        .replaceAll(new RegExp("(')(\!Ref|\!GetAtt)(.*?)(')"), "$2$3")
    fs.writeFileSync(cloudwatchYmlPath, cloudwatchYml)

    // modify serverless.yml with new resources (function object and role resource)
    const serverlessYmlPath = path.join(projectRootPath, './serverless.yml')
    const serverless = yaml.safeLoad(fs.readFileSync(serverlessYmlPath).toString())
    serverless.functions.push(`\${file(./src/functions/${name}/index.yml)}`)
    serverless.resources.push(`\${file(./src/functions/${name}/role.yml)}`)
    fs.writeFileSync(
        serverlessYmlPath,
        yaml.safeDump(serverless)
    )
}

async function newTable({ name, primaryKey, secondaryKey, timeToLive, getItem, putItem, updateItem, deleteItem, query, scan, readCapacityUnits, writeCapacityUnits, tags }) {
    const path = require("path")
    const fs = require("fs")

    const projectRootPath = path.join(__dirname, '../')
    const tableFolderPath = path.join(projectRootPath, `./src/tables/${name}`)
    const templatesPath = path.join(projectRootPath, './templates/table')

    // load the template and replace interpolatable values with their associated variables
    let tableTemplate = fs.readFileSync(path.join(templatesPath, './index.yml')).toString()
        .replaceAll('{{name}}', name)
        .replaceAll('{{name.toLowerCase}}', name.toLowerCase())
        .replaceAll('{{name.capitalizeFirst}}', _capitalizeFirst(name))
        .replaceAll('{{primaryKey.name}}', primaryKey.split(',')[0])
        .replaceAll('{{primaryKey.type}}', primaryKey.split(',')[1])
        .replaceAll('{{readCapacityUnits}}', readCapacityUnits)
        .replaceAll('{{writeCapacityUnits}}', writeCapacityUnits)

    if (secondaryKey) {
        tableTemplate = tableTemplate
            .replaceAll('{{secondaryKey.name}}', secondaryKey.split(',')[0])
            .replaceAll('{{secondaryKey.type}}', secondaryKey.split(',')[1])
            .replaceAll('({{if secondaryKey}}|{{endif secondaryKey}})', '')
    }
    else {
        tableTemplate = tableTemplate
            .replaceAll('(.)*{{if secondaryKey}}(.|\n)*?{{endif secondaryKey}}', '')
    }

    if (timeToLive) {
        tableTemplate = tableTemplate
            .replaceAll('{{timeToLive}}', timeToLive)
            .replaceAll('({{if timeToLive}}|{{endif timeToLive}})', '')
    }
    else {
        tableTemplate = tableTemplate
            .replaceAll('(.)*{{if timeToLive}}(.|\n)*?{{endif timeToLive}}', '')
    }
    // valid table json object containing its cloudformation properties
    const tableJson = yaml.safeLoad(tableTemplate)

    // base template from which we create a new table policy
    let policyTemplate = fs.readFileSync(path.join(templatesPath, './policy.yml')).toString()

    // List of policy names w/ associated values passed by cli args or their defaults
    // More should be added, e.g. BatchGetItem
    const policies = [
        { name: 'GetItem', functions: getItem },
        { name: 'PutItem', functions: putItem },
        { name: 'UpdateItem', functions: updateItem },
        { name: 'DeleteItem', functions: deleteItem },
        { name: 'Query', functions: query },
        { name: 'Scan', functions: scan }
    ]

    // Loop over every policy kind
    policies.forEach(policy => {
        // NOTE: policy.functions is defined if the yargs option has a "default" property
        // This is only true in the case of getItem, putItem and any other list provided by the user
        if (policy.functions) {
            // local reference to baseline policy template
            const _policyTemplate = policyTemplate
                .replaceAll('{{name}}', name)
                .replaceAll('{{name.capitalizeFirst}}', _capitalizeFirst(name))
                .replaceAll('{{name.toLowerCase}}', name.toLowerCase())
                .replaceAll('{{policy.name}}', policy.name)

            // At this point, policyJson is a valid IAM policy but w/o a Roles key with a list of function roles
            const policyJson = yaml.safeLoad(_policyTemplate, { schema: slsSchema })
            // check if functions were defined (would not be run in the case of default getItem and putItem)
            // or any other flag (e.g. --deleteItem) when not providing a list of function names
            // If so, push the function's role id to the list of Roles to which to apply this policy
            if (policy.functions.length && policy.functions[0]) {
                policyJson[`${_capitalizeFirst(name)}Table${policy.name}`].Properties.Roles = []
                policy.functions.forEach(functionName => {
                    policyJson[`${_capitalizeFirst(name)}Table${policy.name}`].Properties.Roles.push(`!Ref ${_capitalizeFirst(functionName)}Role`)
                })
            }
            // Include policy in the table's json object (will be included with it)
            tableJson.Resources = { ...tableJson.Resources, ...policyJson }
        }
    })

    // Make sure !Ref and !GetAtt tags aren't stringified
    const ymlString = yaml.safeDump(tableJson, { schema: slsSchema })
        .replaceAll(new RegExp("(')(\!Ref|\!GetAtt)(.*?)(')"), "$2$3")

    // create table folder
    fs.mkdirSync(tableFolderPath)

    // write new table yml
    fs.writeFileSync(path.join(tableFolderPath, './index.yml'), ymlString)

    // import existing table data objects and create a new one in memory
    const tables = require('../src/data/tables.json')
    tables[name.toLowerCase()] = {
        name: _capitalizeFirst(name),
        tags: [
            {
                Key:"resourceType",
                Value: "table"
            }
        ]
    }

    // if tags were provided, add them to the new table data object
    if (tags) {
        tags.forEach(tag => {
            const [Key, Value] = tag.split("=")
            tables[name.toLowerCase()].tags.push({
                Key,
                Value
            })
        })
    }

    // write new table data to tables.json
    const tablesDataPath = path.join(projectRootPath, './src/data/tables.json')
    fs.writeFileSync(tablesDataPath, JSON.stringify(tables, null, 2))

    // update serverless.yml with new resource
    const serverless = yaml.safeLoad(fs.readFileSync(path.join(projectRootPath, './serverless.yml')).toString())
    serverless.resources.push(`\${file(./src/tables/${name}/index.yml)}`)
    fs.writeFileSync(path.join(projectRootPath, './serverless.yml'), yaml.safeDump(serverless))


}