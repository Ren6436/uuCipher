"use strict";
const Crypto = require("crypto");
const { DaoFactory } = require("uu_appg01_server").ObjectStore;
const { AuthenticationService } = require("uu_appg01_server").Authentication;
const { UriBuilder } = require("uu_appg01_server").Uri;
const { UuDateTime } = require("uu_i18ng01");
const { ProgressClient } = require("uu_consoleg02-uulib");

const Errors = require("../../api/errors/cipr-main-error");
const Warnings = require("../../api/warnings/cipr-main-warning");
const Validator = require("../../components/validator");
const DtoBuilder = require("../../components/dto-builder");
const ScriptEngineClient = require("../../components/script-engine-client");
const CiprMainClient = require("../../components/cipr-main-client");
const StepHandler = require("../../components/step-handler");

const ProgressConstants = require("../../constants/progress-constants");
const CiprMainConstants = require("../../constants/cipr-main-constants");
const TerritoryConstants = require("../../constants/territory-constants");
const Configuration = require("../../components/configuration");

const SCRIPT_CODE = "uu_cipr_maing01-uuscriptlib/cipr-main/set-state-closed";

class SetStateClosedAbl {
  constructor() {
    this.dao = DaoFactory.getDao(CiprMainConstants.Schemas.CIPR_INSTANCE);
  }

  async setStateClosed(uri, dtoIn) {
    // HDS 1
    const awid = uri.getAwid();
    Validator.validateDtoIn(uri, dtoIn);

    // HDS 2
    let uuCipr = await this.dao.getByAwid(awid);

    if (!uuCipr) {
      // 2.1
      throw new Errors.SetStateClosed.UuCiprDoesNotExist({ awid });
    }

    if (uuCipr.state !== CiprMainConstants.StateMap.ACTIVE) {
      // 2.2
      throw new Errors.SetStateClosed.NotInProperState({
        state: uuCipr.state,
        expectedStateList: [CiprMainConstants.StateMap.ACTIVE],
      });
    }

    if (uuCipr.temporaryData && uuCipr.temporaryData.useCase !== uri.getUseCase()) {
      // 2.3
      throw new Errors.SetStateClosed.UseCaseExecutionForbidden({
        concurrencyUseCase: uuCipr.temporaryData.useCase,
      });
    }

    // HDS 3
    const configuration = await Configuration.getUuSubAppConfiguration({
      awid,
      artifactId: uuCipr.artifactId,
      uuTerritoryBaseUri: uuCipr.uuTerritoryBaseUri,
    });

    // HDS 4
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const lockSecret = Crypto.randomBytes(32).toString("hex");
    const progressClient = await this._createSetStateClosedProgress(
      uuCipr,
      dtoIn,
      configuration,
      lockSecret,
      sysIdentitySession,
    );

    // HDS 5
    if (!uuCipr.temporaryData) {
      uuCipr = await this.dao.updateByAwid({
        awid,
        temporaryData: {
          useCase: uri.getUseCase(),
          dtoIn: {},
          stepList: [CiprMainConstants.SetStateClosedStepMap.CLOSE_STARTED.code],
          progressMap: {
            progressCode: progressClient.progress.code,
            uuConsoleUri: configuration.uuConsoleBaseUri,
            consoleCode: CiprMainConstants.getMainConsoleCode(awid),
          },
        },
      });
    }

    // TODO If your application requires any additional steps, add them here...

    // HDS 6
    await this._runScript(uri.getBaseUri(), configuration, progressClient.progress.lockSecret, sysIdentitySession);

    // HDS 7
    return DtoBuilder.prepareDtoOut({ data: uuCipr });
  }

  async _setStateClosedFinalize(uri, dtoIn) {
    // HDS 1
    const awid = uri.getAwid();
    Validator.validateDtoInCustom(uri, dtoIn, "sysUuAppWorkspaceSetStateClosedFinalizeDtoInType");

    // HDS 2
    let uuCipr = await this.dao.getByAwid(awid);

    if (!uuCipr) {
      // 2.1
      throw new Errors._setStateClosedFinalize.UuCiprDoesNotExist({ awid });
    }

    if (!uuCipr.state === CiprMainConstants.StateMap.ACTIVE) {
      // 2.2
      throw new Errors._setStateClosedFinalize.NotInProperState({
        state: uuCipr.state,
        expectedStateList: [CiprMainConstants.StateMap.ACTIVE],
      });
    }

    if (!uuCipr.temporaryData) {
      // 2.3
      throw new Errors._setStateClosedFinalize.MissingRequiredData();
    }

    if (uuCipr.temporaryData && uuCipr.temporaryData.useCase !== "sys/uuAppWorkspace/setStateClosed") {
      // 2.4
      throw new Errors._setStateClosedFinalize.UseCaseExecutionForbidden({
        concurrencyUseCase: uuCipr.temporaryData.useCase,
      });
    }

    // HDS 3
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const progress = {
      code: CiprMainConstants.getSetStateClosedProgressCode(uuCipr.awid),
      lockSecret: dtoIn.lockSecret,
    };
    let progressClient = null;
    if (!uuCipr.temporaryData.stepList.includes(CiprMainConstants.SetStateClosedStepMap.PROGRESS_ENDED.code)) {
      progressClient = await ProgressClient.get(uuCipr.temporaryData.progressMap.uuConsoleUri, progress, {
        session: sysIdentitySession,
      });
    }
    const stepHandler = new StepHandler({
      schema: CiprMainConstants.Schemas.CIPR_INSTANCE,
      progressClient,
      stepList: uuCipr.temporaryData.stepList,
    });

    // TODO If your application requires any additional steps, add them here...

    // HDS 4
    uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.SetStateClosedStepMap.AWSC_CLOSED, async () => {
      const ciprMainClient = new CiprMainClient(uuCipr, uuCipr.uuTerritoryBaseUri);
      try {
        await ciprMainClient.setAwscState(CiprMainConstants.StateMap.FINAL);
      } catch (e) {
        if (e.cause?.code !== TerritoryConstants.INVALID_ARTIFACT_STATE) {
          throw e;
        } else {
          DtoBuilder.addWarning(new Warnings._setStateClosedFinalize.AwscAlreadyInFinalState());
        }
      }
    });

    // HDS 5
    uuCipr = await stepHandler.handleStep(
      uuCipr,
      CiprMainConstants.SetStateClosedStepMap.PROGRESS_ENDED,
      async () => {
        await progressClient.end({
          state: ProgressConstants.StateMap.COMPLETED,
          message: "Setting closed state finished.",
          expireAt: UuDateTime.now().shiftDay(7),
          doneWork: CiprMainConstants.getSetStateClosedStepCount(),
        });
      },
      false,
    );

    // HDS 6
    uuCipr = await this.dao.updateByAwid({
      awid,
      state: CiprMainConstants.StateMap.FINAL,
      temporaryData: null,
    });

    // HDS 7
    return DtoBuilder.prepareDtoOut();
  }

  _parseTerritoryUri(locationUri) {
    let uuTerritoryUri;

    try {
      uuTerritoryUri = UriBuilder.parse(locationUri);
    } catch (e) {
      throw new Errors.SetStateClosed.UuTLocationUriParseFailed({ uri: locationUri }, e);
    }

    return uuTerritoryUri;
  }

  async _createSetStateClosedProgress(uuCipr, dtoIn, config, lockSecret, session) {
    const uuTerritoryUri = this._parseTerritoryUri(uuCipr.uuTerritoryBaseUri);

    let progressClient;
    let progress = {
      expireAt: UuDateTime.now().shiftDay(7),
      name: CiprMainConstants.getSetStateClosedProgressName(uuCipr.awid),
      code: CiprMainConstants.getSetStateClosedProgressCode(uuCipr.awid),
      authorizationStrategy: "boundArtifact",
      boundArtifactUri: uuTerritoryUri.setParameter("id", uuCipr.artifactId).toUri().toString(),
      boundArtifactPermissionMatrix: CiprMainConstants.CONSOLE_BOUND_MATRIX,
      lockSecret,
    };

    try {
      progressClient = await ProgressClient.get(config.uuConsoleBaseUri, { code: progress.code }, { session });
    } catch (e) {
      if (e.cause?.code !== ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        throw new Errors.SetStateClosed.ProgressGetCallFailed({ progressCode: progress.code }, e);
      }
    }

    if (!progressClient) {
      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.SetStateClosed.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    } else if (dtoIn.force) {
      try {
        await progressClient.releaseLock();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_RELEASE_DOES_NOT_EXIST) {
          throw new Errors.SetStateClosed.ProgressReleaseLockCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        await progressClient.setState({ state: "cancelled" });
      } catch (e) {
        DtoBuilder.addWarning(new Warnings.SetStateClosed.ProgressSetStateCallFailed(e.cause?.paramMap));
      }

      try {
        await progressClient.delete();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_DELETE_DOES_NOT_EXIST) {
          throw new Errors.SetStateClosed.ProgressDeleteCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.SetStateClosed.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    }

    try {
      await progressClient.start({
        message: "Progress was started",
        totalWork: CiprMainConstants.getSetStateClosedStepCount(),
        lockSecret,
      });
    } catch (e) {
      throw new Errors.SetStateClosed.ProgressStartCallFailed({ progressCode: progress.code }, e);
    }

    return progressClient;
  }

  async _runScript(appUri, configuration, lockSecret, session) {
    const scriptEngineClient = new ScriptEngineClient({
      scriptEngineUri: configuration.uuScriptEngineBaseUri,
      consoleUri: configuration.uuConsoleBaseUri,
      consoleCode: CiprMainConstants.getMainConsoleCode(appUri.getAwid()),
      scriptRepositoryUri: configuration.uuScriptRepositoryBaseUri,
      session,
    });

    const scriptDtoIn = {
      uuCiprUri: appUri.toString(),
      lockSecret,
    };

    await scriptEngineClient.runScript({ scriptCode: SCRIPT_CODE, scriptDtoIn });
  }
}

module.exports = new SetStateClosedAbl();
