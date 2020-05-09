/* eslint-disable */
const projectName = 'sls-ts';
const projectTag = { Key: 'project', Value: projectName };
const stageTag = { Key: 'stage', Value: process.env.SLS_STAGE };
const createdTag = { Key: 'created', Value: Date.now() };

const defaultTags = [
  projectTag,
  stageTag,
  createdTag
];

module.exports = _ => ({
  projectName,
  tables: {
    users: {
      name: `${projectName}-Users`,
      tags: [...defaultTags, { Key: 'resourceType', Value: 'table' }, { Key: 'scope', Value: 'auth' }],
    },
    sessions: {
      name: `${projectName}-Sessions`,
      tags: [...defaultTags, { Key: 'resourceType', Value: 'table' }, { Key: 'scope', Value: 'auth' }],
    },
  },
});

module.exports.projectTag = projectTag
module.exports.stageTag = stageTag
module.exports.createdTag = createdTag
/* eslint-enable */
