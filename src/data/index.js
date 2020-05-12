/* eslint-disable */
const tables = require("./tables.json")
const projectName = 'sls-ts';
const projectTag = { Key: 'project', Value: projectName };
const stageTag = { Key: 'stage', Value: process.env.SLS_STAGE };
const createdTag = { Key: 'created', Value: Date.now() };

const stackTags = [
  projectTag,
  stageTag,
  createdTag
];

module.exports = () => ({
  projectName,
  stackTags,
  tables
});

module.exports.projectTag = projectTag
module.exports.stageTag = stageTag
module.exports.createdTag = createdTag
/* eslint-enable */
