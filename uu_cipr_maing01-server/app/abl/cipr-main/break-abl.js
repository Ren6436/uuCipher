"use strict";
const { Validator } = require("uu_appg01_server").Validation;
const { ValidationHelper } = require("uu_appg01_server").AppServer;
const { DaoFactory } = require("uu_appg01_server").ObjectStore;

const Errors = require("../../api/errors/break-errors.js");
const Warnings = require("../../api/warnings/break-warning.js");

class BreakAbl {
  constructor() {
    this.validator = Validator.load();
    this.dao = DaoFactory.getDao("break");
  }

  async create(awid, dtoIn) {
    let uuAppErrorMap = {};

    // validation of dtoIn
    const validationResult = this.validator.validate("breakCreateDtoInType", dtoIn);
    uuAppErrorMap = ValidationHelper.processValidationResult(
      dtoIn,
      validationResult,
      uuAppErrorMap,
      Warnings.Create.UnsupportedKeys.code,
      Errors.Create.InvalidDtoIn,
    );

    // Todp dtoOut
    dtoIn.awid = awid;
    const breaks = await this.dao.create(dtoIn);

    const dtoOut = { ...breaks, uuAppErrorMap };
    return dtoOut;
  }
}

module.exports = new BreakAbl();
