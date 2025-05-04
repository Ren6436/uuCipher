"use strict";
const { Validator } = require("uu_appg01_server").Validation;
const { ValidationHelper } = require("uu_appg01_server").AppServer;
const { DaoFactory } = require("uu_appg01_server").ObjectStore;

const Errors = require("../../api/errors/break-errors.js");
const Warnings = require("../../api/warnings/break-warning.js");

const axios = require("axios");
const FormData = require("form-data");

class BreakAbl {
  constructor() {
    this.validator = Validator.load();
    this.dao = DaoFactory.getDao("break");
  }

  async create(awid, dtoIn) {
    let uuAppErrorMap = {};

    const validationResult = this.validator.validate("breakCreateDtoInType", dtoIn);
    uuAppErrorMap = ValidationHelper.processValidationResult(
      dtoIn,
      validationResult,
      uuAppErrorMap,
      Warnings.Create.UnsupportedKeys.code,
      Errors.Create.InvalidDtoIn,
    );

    const formData = new FormData();
    if (dtoIn.data?.value?.value) {
      formData.append("text", dtoIn.data.value.value);
    }

    let result;
    try {
      const response = await axios.post("http://localhost:5555/api/break", formData);
      result = Object.values(response.data).join("");
      } catch (e) {
        throw new Errors.Create.ExternalCallFailed({
          cause: e.message,
          uuAppErrorMap,
        })
      }

    dtoIn.awid = awid;
    const dtoOut = {
      result,
      uuAppErrorMap,
    };
    return dtoOut;
  }
}

module.exports = new BreakAbl();