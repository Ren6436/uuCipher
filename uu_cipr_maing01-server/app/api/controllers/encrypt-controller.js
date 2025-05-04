"use strick";
const EncryptAbl = require("../../abl/cipr-main/encrypt-abl.js");

class EncryptController {
  create(ucEnv) {
    const awid = ucEnv.getUri().getAwid();
    const dtoIn = ucEnv.parameters;
    return EncryptAbl.create(awid, dtoIn);
  }
}

module.exports = new EncryptController();