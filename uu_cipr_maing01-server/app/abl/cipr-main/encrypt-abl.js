"use strict";
const { Validator } = require("uu_appg01_server").Validation;
const { ValidationHelper } = require("uu_appg01_server").AppServer;
const { DaoFactory } = require("uu_appg01_server").ObjectStore;

const Errors = require("../../api/errors/encrypt-errors.js");
const Warnings = require("../../api/warnings/encrypt-warning.js");

const axios = require("axios");
const FormData = require("form-data");

class EncryptAbl {
  constructor() {
    this.validator = Validator.load();
    this.dao = DaoFactory.getDao("encrypt");
  }

  async create(awid, dtoIn) {
    let uuAppErrorMap = {};

    const validationResult = this.validator.validate("encryptCreateDtoInType", dtoIn);
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
    if (dtoIn.file) {
      formData.append("file", dtoIn.file);
    }

    let result;
    try {
      const response = await axios.post("http://localhost:5555/api/encrypt", formData);
      result = {
        cipherText: response.data.cipherText,
        key: response.data.key,
      };
      console.log("response", result);
    } catch (e) {
      throw new Errors.Create.ExternalCallFalled({
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

module.exports = new EncryptAbl();