"use strict";
const CiprMainUseCaseError = require("./cipr-main-use-case-error.js");

class CallScriptEngineFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("callScriptEngineFailed", "Call scriptEngine failed.", paramMap, cause);
  }
}

module.exports = {
  CallScriptEngineFailed,
};
