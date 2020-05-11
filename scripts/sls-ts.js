#!/usr/bin/env node

// string utils
function _capitalizeFirst(name) {
    const splits = name.split('')
    splits[0] = splits[0].toUpperCase()
    return splits.join('')
}

String.prototype.nameMacro = function(name) {
    const str = this.valueOf()
    return str.replace(new RegExp('{{name}}', 'g'), name)
}

String.prototype.capitalizeFirst = function(name) {
    const str = this.valueOf()
    return str.replace(new RegExp('{{name.capitalize_first}}', 'g'), _capitalizeFirst(name))
}


// main script
require("yargs")
    .command("new-function <name>", 'create a new function', (yargs) => {
        yargs.positional("name", {
            describe: "name of the new function"
        })
    }, argv => {
        newFunction(argv.name)
    })
    .command("new-table [name]", 'create a new table', (yargs) => {
        
    }).argv

async function newFunction(name) {
    const path = require("path")
    const fs = require("fs")
    
    const projectRootPath = path.join(__dirname, '../')
    const functionFolderPath = path.join(projectRootPath, `./src/functions/${name}`)
    const templatesPath = path.join(projectRootPath, './templates')

    // create function folder
    fs.mkdirSync(functionFolderPath)

    await Promise.all([
        new Promise((resolve) => {
            // write function's index.yml file
            const functionIndexYmlPath = path.join(functionFolderPath, './index.yml')
            const functionIndexYmlTemplatePath = path.join(templatesPath, './function.yml')
            fs.writeFileSync(functionIndexYmlPath,
                fs.readFileSync(functionIndexYmlTemplatePath)
                    .toString().nameMacro(name).capitalizeFirst(name)
            )
            resolve()
        }),

        new Promise((resolve) => {
            // write function's role file
            const functionRoleYmlPath = path.join(functionFolderPath, './role.yml')
            const functionRoleYmlTemplatePath = path.join(templatesPath, './functionRole.yml')
            fs.writeFileSync(functionRoleYmlPath,
                fs.readFileSync(functionRoleYmlTemplatePath)
                    .toString().capitalizeFirst(name)
            )
            resolve()
        }),

        new Promise((resolve) => {
            // write function's basic package.json file
            const functionPackageJsonPath = path.join(functionFolderPath, './package.json')
            const functionPackageJsonTemplatePath = path.join(templatesPath, './functionPackage.json')
            fs.writeFileSync(functionPackageJsonPath,
                fs.readFileSync(functionPackageJsonTemplatePath)
                    .toString().nameMacro(name)
            )
            resolve()
        }),

        new Promise((resolve) => {
            // write function's handler
            const functionIndexTsPath = path.join(functionFolderPath, './index.ts')
            const functionIndexTsTemplatePath = path.join(templatesPath, './functionIndex.txt')
            fs.writeFileSync(functionIndexTsPath,
                fs.readFileSync(functionIndexTsTemplatePath)
                    .toString().capitalizeFirst(name)
            )
            resolve()
        })
    ])

    // modify serverless.yml
    const yaml = require("js-yaml")
    const serverlessYmlPath = path.join(projectRootPath, './serverless.yml')
    const serverless = yaml.safeLoad(fs.readFileSync(serverlessYmlPath).toString())
    serverless.functions.push(`\${file(./src/functions/${name}/index.yml)}`)
    serverless.resources.push(`\${file(./src/functions/${name}/role.yml)}`)
    fs.writeFileSync(
        serverlessYmlPath,
        yaml.safeDump(serverless)
    )
}