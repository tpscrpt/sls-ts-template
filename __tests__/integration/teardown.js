/* eslint-disable */
const { execSync } = require("child_process");
const { readFileSync } = require("fs");
const { join } = require("path");

module.exports = async function () {
  const stageString = readFileSync(join(__dirname, './.stage')).toString()

  execSync(`SLS_STAGE=${stageString} yarn remove:test`, {
    stdio: "inherit",
  });
};
/* eslint-enable */
