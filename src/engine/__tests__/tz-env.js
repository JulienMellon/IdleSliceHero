// Jest environment whose `process.env` is the real one, so a test can switch `process.env.TZ` and have `Date` follow.
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

module.exports = class TzEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.process.env = process.env;
  }
};
