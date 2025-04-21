"use strict";
const CiprMainUseCaseError = require("../errors/cipr-main-use-case-error.js");

class CiprMainUseCaseWarning {
  constructor(code, message, paramMap) {
    this.code = CiprMainUseCaseError.generateCode(code);
    this.message = message;
    this.paramMap = paramMap instanceof Error ? undefined : paramMap;
  }
}

module.exports = CiprMainUseCaseWarning;
