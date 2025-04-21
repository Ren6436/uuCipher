"use strict";
const CiprMainUseCaseError = require("./cipr-main-use-case-error.js");

class InvalidDtoIn extends CiprMainUseCaseError {
  constructor(dtoOut, paramMap = {}, cause = null) {
    super("invalidDtoIn", "DtoIn is not valid.", paramMap, cause, undefined, dtoOut);
  }
}

module.exports = {
  InvalidDtoIn,
};
