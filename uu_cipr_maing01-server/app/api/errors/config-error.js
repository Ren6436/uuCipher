"use strict";
const CiprMainUseCaseError = require("./cipr-main-use-case-error.js");

class ConfigurationLoadFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("configurationLoadFailed", "Failed to obtain configuration needed to continue.", paramMap, cause);
  }
}

class UuAppMetaModelDoesNotExist extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuAppMetaModelDoesNotExist", "Metamodel does not exist.", paramMap, cause);
  }
}

module.exports = {
  ConfigurationLoadFailed,
  UuAppMetaModelDoesNotExist,
};
