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
};

module.exports = {
  Create,
};
