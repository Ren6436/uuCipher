"use strict";

const { Uri } = require("uu_appg01_server").Uri;

// eslint-disable-next-line no-undef
scriptContext.dtoOut = { uuAppErrorMap: {} };
// eslint-disable-next-line no-undef
let { dtoIn, console, dtoOut, session } = scriptContext;

/*@@viewOn:imports*/
const { Validator } = require("uu_appg01_server").Validation;
const { ValidationHelper } = require("uu_appg01_server").AppServer;
const { UseCaseError } = require("uu_appg01_server").AppServer;
const { ProgressClient } = require("uu_consoleg02-uulib");

const CiprMainClient = uuScriptRequire("uu_cipr_maing01-uuscriptlib/cipr-main-client", {
  scriptRequireCacheEnabled: false,
});
/*@@viewOff:imports*/

/*@@viewOn:names*/
const Names = {
  SCRIP_LIB_NAME: "uu_cipr_maing01-uuscriptlib",
  SCRIPT_NAME: "CiprMainSetStateClosed",
};
/*@@viewOff:names*/

/*@@viewOn:constants*/
const CMD_NAME = "setStateClosed";
/*@@viewOff:constants*/

/*@@viewOn:errors*/
const Errors = {
  ERROR_PREFIX: `${Names.SCRIP_LIB_NAME}/${Names.SCRIPT_NAME}/`,

  InvalidDtoIn: class extends UseCaseError {
    constructor(dtoOut, paramMap, cause = null) {
      if (paramMap instanceof Error) {
        cause = paramMap;
        paramMap = {};
      }
      super({ dtoOut, paramMap, status: 400 }, cause);
      this.message = "DtoIn is not valid.";
      this.code = `${Errors.ERROR_PREFIX}invalidDtoIn`;
    }
  },
};
/*@@viewOff:errors*/

/*@@viewOn:scriptClient*/
class CiprMainSetStateClosedClient {
  constructor(lockSecret) {
    this.lockSecret = lockSecret;
    this.progressClient = null;
    this.ciprMainClient = null;
    this.uuCipr = null;
  }

  async start() {
    this.ciprMainClient = new CiprMainClient(dtoIn.uuCiprUri);
    this.uuCipr = await this.ciprMainClient.load();
    this.progressClient = await ProgressClient.createInstance(
      this.uuCipr.data.temporaryData.progressMap.uuConsoleUri,
      {
        code: this.uuCipr.data.temporaryData.progressMap.progressCode,
        lockSecret: this.lockSecret,
      },
      { session }
    );

    return this.uuCipr;
  }

  async setStateClosedFinalize() {
    return this.ciprMainClient.setStateClosedFinalize(this.lockSecret);
  }
}
/*@@viewOff:scriptClient*/

/*@@viewOn:validateDtoIn*/
const DtoInValidationSchema = `const scriptCiprMainSetStateClosedDtoInType = shape({
  uuCiprUri: string().isRequired(),
  lockSecret: hexa64Code().isRequired(),
})`;

function validateDtoIn(dtoIn, uuAppErrorMap = {}) {
  let dtoInValidator = new Validator(DtoInValidationSchema, true);
  let validationResult = dtoInValidator.validate("scriptCiprMainSetStateClosedDtoInType", dtoIn);
  return ValidationHelper.processValidationResult(dtoIn, validationResult, uuAppErrorMap, `${Errors.ERROR_PREFIX}unsupportedKeys`, Errors.InvalidDtoIn);
}
/*@@viewOff:validateDtoIn*/

/*@@viewOn:helpers*/
/*@@viewOff:helpers*/

async function main() {
  await console.info(`Script uuCipr set state closed started`);
  dtoOut.dtoIn = dtoIn;
  const uuAppErrorMap = dtoOut.uuAppErrorMap;

  // validates dtoIn
  await console.info(`Validating dtoIn schema.`);
  await console.info(JSON.stringify(dtoIn));

  validateDtoIn(dtoIn, uuAppErrorMap);

  // initialization ciprMain client and variables
  let mainContext = new CiprMainSetStateClosedClient(dtoIn.lockSecret);
  let uuCipr = await mainContext.start();

  await console.log(`<uu5string/><UuConsole.Progress baseUri='${Uri.parse(scriptContext.scriptRuntime.getScriptConsoleUri()).baseUri}' progressCode='${mainContext.progressClient.progress.code}' />`);

  // TODO Add steps your application needs here...

  uuCipr = await mainContext.setStateClosedFinalize();

  return { data: uuCipr, uuAppErrorMap };
}

main();
