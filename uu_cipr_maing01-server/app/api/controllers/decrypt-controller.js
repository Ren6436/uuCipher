"use strick";
const DecryptAbl = require("../../abl/cipr-main/decrypt-abl.js");

class DecryptController {
  create(ucEnv) {
    const awid = ucEnv.getUri().getAwid();
    const dtoIn = ucEnv.parameters;
    return DecryptAbl.create(awid, dtoIn);
  }
}

module.exports = new DecryptController();
