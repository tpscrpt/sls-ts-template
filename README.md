<a href="http://www.youtube.com/watch?feature=player_embedded&v=ZBjWcbmlzXY
" target="_blank"><img src="http://img.youtube.com/vi/ZBjWcbmlzXY/0.jpg"
alt="IMAGE ALT TEXT HERE" width="240" height="180" border="10" /></a>

[upstream](https://github.com/jeremigendron/sls-ts-template)

# Usage
Please go over the structure of this template to understand the gist of how every component is used.
When you understand the overall structure, you can use `yarn sls-ts` to issue commands (add new functions or tables w/ boilerplate).

> NOTE: Using the sls-ts script provided will strip comments from the serverless.yml file. PRs welcome.

## What your serverless.yml should look like

Keep it modular and follow defaults if not using provided sls-ts script.

```yml
service: sls-ts

provider:
  name: aws
  runtime: nodejs12.x
  stage: ${env:SLS_STAGE}
  region: ${env:SLS_REGION}
  environment:
    stage: ${env:SLS_STAGE}
    region: ${env:SLS_REGION}

plugins:
 - "@jeremigendron/sls-ts-plugin"

custom:
  data: ${file(./src/data/index.js)}
  region: ${env:SLS_REGION}
  stage: ${env:SLS_STAGE}

package:
  individually: true
  exclude:
    - ./**

functions:
  - ${file(./src/functions/signin/index.yml)}

resources:
  # If you need outputs, remove this column of pounds and follow the structure
  #- Outputs:
  #    ApiUrl:
  #      Description: "The API Gateway URL"
  #      Value:
  #        Fn::Join:
  #          - ""
  #          - - "https://"
  #            - Ref: ApiGatewayRestApi
  #            - ".execute-api.${self:custom.region}.amazonaws.com/${self:custom.stage}"

  # Tables
  - ${file(./src/tables/users/index.yml)}
  - ${file(./src/tables/sessions/index.yml)}

  # Function roles
  - ${file(./src/functions/signin/role.yml)}

  # Shared policies
  - ${file(./src/policies/cloudwatch.yml)}
```

## Caveats
You MUST ONLY INSTALL ANY devDependency (including those used by only a single function) in the root package.json.json. Otherwise, they would be included in the deployment package of the function. There are ways around this but they require much more work (check and remove devDependencies on a per-function basis -- if you feel like losing hair, PRs welcome).

No production deployment script is included, because your release pipeline might not be common.

If you run test:integration and it fails without deleting the stack, you need to run `SLS_STAGE=test-<uuid_generated_for_that_deployment> yarn remove:test` or it will cost you money.

# Use case
Setting up a proper Serverless project can be pretty daunting in a lot of cases, especially when you're supposed to rely on third party plugins (they don't work well most of the time) and/or you're trying to use TypeScript.

This template offers good boilerplate to get you up and running, and keeps in mind Developer Experience and scalability.

This is quite a detailed template, and it's also somewhat opinionated. The main reason for that is the lack of proper API documentation from Serverless and a lot of third party plugins. You'd normally be constrained into making mere trivial services using the framework, and are kind of left hanging when you're trying to setup a workable environment. Trying to implement just the minimum to be able to write code that scales is extremely unintuitive using this combination of tools, so I tried to give you good pointers.

# How to
Functions are defined in their own folders (src/functions), with their own package.json and dependencies. Their roles are custom and you shoud follow the boilerplate provided for every new function you add.

At the root of the project lies a package.json containing only development dependencies and workspace information. Using yarn workspaces with "nohoist" allows your functions to always have their dependencies in-tree when running yarn from the root. This is useful because you're much less likely to try to deploy a function with missing depdendencies.

Also at the root, you'll find a serverless.yml with highly modular components (no resources are defined in the file, they are only included through the file() macro).

Tables and other resources are defined in yml files, with policies referring directly to function role keys. This means you change a policy's "Roles" key to apply it to a new function.

Don't forget to include new resources (policies, buckets, etc.) in the same way that tables are included in serverless.yml. Also follow the same file structure for .ymls, as they have to be precisely that in all cases.

The development flow is pretty simple: write lambda functions in TypeScript, support them with functional/unit tests, run yarn deploy:dev and make some manual verifications against the deployed functions to then write your integration tests in fewer tries. Once you have integration tests, run yarn test:integration to automatically launch a new stack, run tests and tear it down afterwards.

During development, if you come into issues with missing dependencies, run yarn package:dev and check the resulting .zip archives under the ./.serverless folder.

Other than that, repository setup and CI/CD will enable you to have a solid base for building a highly scalable product. Gitops are left out and are your responsibility.

# Why
It's a shame there's no scalable solution to have a Serverless backend w/ TypeScript. If you've ever tried, you know how painful and slow it is. The most popular solution is not good, so I made this one. I hope it's better.

TypeScript on the backend is highly beneficial, since its types can be imported into the frontend or an API client for a better DX for consumers. It's also generally quicker once your backend is typed, since intellisense will help you a lot and there'll be 0 back and forth between files.