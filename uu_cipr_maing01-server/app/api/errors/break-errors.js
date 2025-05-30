"use strict";
const CiprMainUseCaseError = require("./cipr-main-use-case-error");

const Create = {
  UC_CODE: `${CiprMainUseCaseError.ERROR_PREFIX}create/`,

  InvalidDtoIn: class extends CiprMainUseCaseError {
    constructor() {
      super(...arguments);
      this.code = `${Create.UC_CODE}invalidDtoIn`;
      this.message = "DtoIn is not valid.";
    }
  },
  ExternalCallFailed: class extends CiprMainUseCaseError {
    constructor(cause, uuAppErrorMap) {
      super(...arguments);
      this.code = `${Create.UC_CODE}externalCallFailed`;
      this.message = "Call to external service failed.";
      this.cause = cause;
      this.uuAppErrorMap = uuAppErrorMap;
    }
  }
};

module.exports = {
  Create,
};
