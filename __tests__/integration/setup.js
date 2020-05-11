/* eslint-disable */
const { writeFileSync } = require("fs")
const { join } = require("path")
const { execSync } = require('child_process');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const apigateway = new AWS.APIGateway({ region: 'us-east-1' })

module.exports = async function () {
  const testStackId = uuidv4();
  const stageString = `test-${testStackId}`

  execSync(`yarn cross-env SLS_STAGE=${stageString} yarn deploy:test`, {
    stdio: 'inherit',
  });

  let position = null
  let apiId = ""

  while((position || position === null) && !apiId) {
    const params = {
      limit: 500,
      position: ""
    }
    if (position) params.position = position
    else delete(params.position)

    const response = await apigateway.getRestApis(params).promise()

    // below, notice writing javascript with tsc breathing down your neck
    if (response.items) {
      for (const gateway of response.items) {
        if (gateway && gateway.tags && gateway.tags.STAGE === stageString) {
          if (gateway.id) {
            apiId = gateway.id
            break
          }
        }
      }
    }



    if (apiId) break

    if (!response.position) throw new Error("Couldn't find API Gateway ID")
    position = response.position
  }

  console.log(apiId)

  writeFileSync(join(__dirname, './.apiUrl'), `https://${apiId}.execute-api.us-east-1.amazonaws.com/${stageString}`)
  writeFileSync(join(__dirname, './.stage'), stageString);
};
/* eslint-enable */
