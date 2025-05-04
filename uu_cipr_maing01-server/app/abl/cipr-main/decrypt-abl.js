"use strick";
const { Validator } = require("uu_appg01_server").Validation;
const { ValidationHelper } = require("uu_appg01_server").AppServer;
const { DaoFactory } = require("uu_appg01_server").ObjectStore;

const Errors = require("../../api/errors/decrypt-errors.js");
const Warnings = require("../../api/warnings/decrypt-warning.js");

const axios = require("axios");
const FormData = require("form-data");

class DecryptAbl {
  constructor() {
    this.validator = Validator.load();
    this.dao = DaoFactory.getDao("decrypt");
  }

  async create(awid, dtoIn) {
    let uuAppErrorMap = {};
    console.log(dtoIn);

    const validationResult = this.validator.validate("decryptCreateDtoInType", dtoIn);
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
    if (dtoIn.data?.value?.key) {
      formData.append("key", dtoIn.data.value.key);
    }
    if (dtoIn.file) {
      formData.append("file", dtoIn.file);
    }

    let result;
    try {
      const response = await axios.post("http://localhost:5555/api/decrypt", formData);
      console.log("response", response);
      result = Object.values(response.data).join("");
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
    console.log("dtoout",dtoOut)
    return dtoOut;
  }
}

module.exports = new DecryptAbl();