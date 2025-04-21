"use strick";
const BreakAbl = require("../../abl/cipr-main/break-abl.js");

class BreakController {
  create(ucEnv) {
    const awid = ucEnv.getUri().getAwid();
    const dtoIn = ucEnv.parameters;
    return BreakAbl.create(awid, dtoIn);
  }
}

module.exports = new BreakController();
