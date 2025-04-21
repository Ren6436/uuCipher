"use strict";
const Crypto = require("crypto");
const { DaoFactory } = require("uu_appg01_server").ObjectStore;
const { UuAppWorkspace } = require("uu_appg01_server").Workspace;
const { AuthenticationService } = require("uu_appg01_server").Authentication;
const { UriBuilder } = require("uu_appg01_server").Uri;
const { UuDateTime } = require("uu_i18ng01");
const { ConsoleClient, ProgressClient } = require("uu_consoleg02-uulib");

const Errors = require("../../api/errors/cipr-main-error");
const Warnings = require("../../api/warnings/cipr-main-warning");
const Validator = require("../../components/validator");
const DtoBuilder = require("../../components/dto-builder");
const ScriptEngineClient = require("../../components/script-engine-client");
const CiprMainClient = require("../../components/cipr-main-client");
const StepHandler = require("../../components/step-handler");

const ProgressConstants = require("../../constants/progress-constants");
const CiprMainConstants = require("../../constants/cipr-main-constants");
const Configuration = require("../../components/configuration");

const SCRIPT_CODE = "uu_cipr_maing01-uuscriptlib/cipr-main/clear";

class ClearAbl {
  constructor() {
    this.dao = DaoFactory.getDao(CiprMainConstants.Schemas.CIPR_INSTANCE);
  }

  async clear(uri, dtoIn, session) {
    // HDS 1
    const awid = uri.getAwid();
    Validator.validateDtoIn(uri, dtoIn);

    // HDS 2
    let uuCipr = await this.dao.getByAwid(awid);

    if (uuCipr) {
      if (uuCipr.state !== CiprMainConstants.StateMap.FINAL) {
        // 2.1
        throw new Errors.Clear.NotInProperState({
          state: uuCipr.state,
          expectedStateList: [CiprMainConstants.StateMap.FINAL],
        });
      }

      if (uuCipr.temporaryData && uuCipr.temporaryData.useCase !== uri.getUseCase()) {
        // 2.2
        throw new Errors.SetStateClosed.UseCaseExecutionForbidden({
          concurrencyUseCase: uuCipr.temporaryData.useCase,
        });
      }
    } else {
      try {
        await UuAppWorkspace.setAssignedSysState(awid);
      } catch (e) {
        // 2.3
        throw new Errors.Clear.SetAssignedSysStateFailed({}, e);
      }

      return DtoBuilder.prepareDtoOut({ progressMap: {} });
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
    const progressClient = await this._createClearProgress(
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
          dtoIn: dtoIn.data,
          stepList: [CiprMainConstants.ClearStepMap.CLEAR_STARTED.code],
          progressMap: {
            progressCode: progressClient.progress.code,
            uuConsoleUri: configuration.uuConsoleBaseUri,
            consoleCode: CiprMainConstants.getMainConsoleCode(awid),
          },
        },
      });
    }

    if (uuCipr.temporaryData.stepList.includes(CiprMainConstants.ClearStepMap.CONSOLE_CLEARED.code)) {
      await this._clearFinalize(uri, { lockSecret }, session);
    } else {
      // TODO If your application requires any additional steps, add them here...
  
      // HDS 6
      await this._runScript(
        uri.getBaseUri(),
        dtoIn,
        configuration,
        progressClient.progress.lockSecret,
        sysIdentitySession,
      );
    }

    // HDS 7
    return DtoBuilder.prepareDtoOut({ data: uuCipr });
  }

  async _clearFinalize(uri, dtoIn, session) {
    // HDS 1
    const awid = uri.getAwid();
    Validator.validateDtoInCustom(uri, dtoIn, "sysUuAppWorkspaceInitFinalizeDtoInType");

    // HDS 2
    let uuCipr = await this.dao.getByAwid(awid);

    if (!uuCipr) {
      // 2.1
      throw new Errors._clearFinalize.UuCiprDoesNotExist({ awid });
    }

    if (uuCipr.state !== CiprMainConstants.StateMap.FINAL) {
      // 2.2
      throw new Errors._clearFinalize.NotInProperState({
        state: uuCipr.state,
        expectedStateList: [CiprMainConstants.StateMap.FINAL],
      });
    }

    if (!uuCipr.temporaryData) {
      // 2.3
      throw new Errors._clearFinalize.MissingRequiredData();
    }

    if (uuCipr.temporaryData && uuCipr.temporaryData.useCase !== "sys/uuAppWorkspace/clear") {
      // 2.4
      throw new Errors._clearFinalize.UseCaseExecutionForbidden({
        concurrencyUseCase: uuCipr.temporaryData.useCase,
      });
    }

    // HDS 3
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const progress = {
      code: CiprMainConstants.getClearProgressCode(uuCipr.awid),
      lockSecret: dtoIn.lockSecret,
    };
    let progressClient = null;
    if (!uuCipr.temporaryData.stepList.includes(CiprMainConstants.ClearStepMap.PROGRESS_ENDED.code)) {
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

    // HDS 5
    uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.ClearStepMap.INIT_PROGRESS_DELETED, async () => {
      await this._deleteProgress(
        CiprMainConstants.getInitProgressCode(awid),
        uuCipr.temporaryData.progressMap.uuConsoleUri,
        sysIdentitySession,
      );
    });

    // HDS 6
    uuCipr = await stepHandler.handleStep(
      uuCipr,
      CiprMainConstants.ClearStepMap.SET_STATE_CLOSED_PROGRESS_DELETED,
      async () => {
        await this._deleteProgress(
          CiprMainConstants.getSetStateClosedProgressCode(awid),
          uuCipr.temporaryData.progressMap.uuConsoleUri,
          sysIdentitySession,
        );
      },
    );

    // HDS 7
    uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.ClearStepMap.CONSOLE_CLEARED, async () => {
      await this._clearConsole(
        uuCipr.temporaryData.progressMap.uuConsoleUri,
        CiprMainConstants.getMainConsoleCode(awid),
        sysIdentitySession,
      );
    });

    // HDS 8
    uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.ClearStepMap.PROGRESS_AUTH_STRATEGY_SET, async () => {
      await this._setClearProgressAuthorizationStrategy(
        uuCipr.temporaryData.progressMap.uuConsoleUri,
        uuCipr.temporaryData.progressMap.progressCode,
        awid,
        uuCipr.temporaryData.dtoIn.awidInitiatorList,
        sysIdentitySession,
      );
    });

    // HDS 9
    uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.ClearStepMap.AUTH_STRATEGY_SET, async () => {
      await UuAppWorkspace.setAuthorizationStrategy(
        uri,
        {
          authorizationStrategy: "roleGroupInterface",
          roleGroupUriMap: {},
        },
        session,
      );
    });

    // HDS 10
    uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.ClearStepMap.AWSC_DELETED, async () => {
      const ciprMainClient = new CiprMainClient(uuCipr, uuCipr.uuTerritoryBaseUri);
      await ciprMainClient.deleteAwsc();
    });

    // HDS 11
    uuCipr = await stepHandler.handleStep(
      uuCipr,
      CiprMainConstants.ClearStepMap.PROGRESS_ENDED,
      async () => {
        await progressClient.end({
          state: ProgressConstants.StateMap.COMPLETED,
          message: "Clear finished.",
          expireAt: UuDateTime.now().shiftDay(1),
          doneWork: CiprMainConstants.getSetStateClosedStepCount(),
        });
      },
      false,
    );

    // HDS 12
    if (uuCipr.temporaryData.dtoIn.awidInitiatorList) {
      await UuAppWorkspace.reassign({
        awid,
        awidInitiatorList: uuCipr.temporaryData.dtoIn.awidInitiatorList,
      });
    }

    // HDS 13
    await this.dao.deleteByAwid(awid);

    // HDS 14
    try {
      await UuAppWorkspace.setAssignedSysState(awid);
    } catch (e) {
      throw new Errors._clearFinalize.SetAssignedSysStateFailed({}, e);
    }

    // HDS 15
    return DtoBuilder.prepareDtoOut();
  }

  _parseTerritoryUri(locationUri) {
    let uuTerritoryUri;

    try {
      uuTerritoryUri = UriBuilder.parse(locationUri);
    } catch (e) {
      throw new Errors.Clear.UuTLocationUriParseFailed({ uri: locationUri }, e);
    }

    return uuTerritoryUri;
  }

  async _createClearProgress(uuCipr, dtoIn, config, lockSecret, session) {
    const uuTerritoryUri = this._parseTerritoryUri(uuCipr.uuTerritoryBaseUri);

    let progressClient;
    let progress = {
      expireAt: UuDateTime.now().shiftDay(7),
      name: CiprMainConstants.getClearProgressName(uuCipr.awid),
      code: CiprMainConstants.getClearProgressCode(uuCipr.awid),
      authorizationStrategy: "boundArtifact",
      boundArtifactUri: uuTerritoryUri.setParameter("id", uuCipr.artifactId).toUri().toString(),
      boundArtifactPermissionMatrix: CiprMainConstants.CONSOLE_BOUND_MATRIX,
      lockSecret,
    };

    try {
      progressClient = await ProgressClient.get(config.uuConsoleBaseUri, { code: progress.code }, { session });
    } catch (e) {
      if (e.cause?.code !== ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        throw new Errors.Clear.ProgressGetCallFailed({ progressCode: progress.code }, e);
      }
    }

    if (!progressClient) {
      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Clear.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    } else if (dtoIn.force) {
      try {
        await progressClient.releaseLock();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_RELEASE_DOES_NOT_EXIST) {
          throw new Errors.Clear.ProgressReleaseLockCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        await progressClient.setState({ state: "cancelled" });
      } catch (e) {
        DtoBuilder.addWarning(new Warnings.Clear.ProgressSetStateCallFailed(e.cause?.paramMap));
      }

      try {
        await progressClient.delete();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_DELETE_DOES_NOT_EXIST) {
          throw new Errors.Clear.ProgressDeleteCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Clear.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    }

    try {
      await progressClient.start({
        message: "Progress was started",
        totalWork: CiprMainConstants.getClearStepCount(),
        lockSecret,
      });
    } catch (e) {
      throw new Errors.Clear.ProgressStartCallFailed({ progressCode: progress.code }, e);
    }

    return progressClient;
  }

  async _setClearProgressAuthorizationStrategy(uuConsoleBaseUri, progressCode, awid, awidInitiatorList, session) {
    let progressClient;

    try {
      progressClient = await ProgressClient.get(uuConsoleBaseUri, { code: progressCode }, { session });
    } catch (e) {
      if (e.cause?.code === ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        return;
      } else {
        throw new Errors._clearFinalize.ProgressGetCallFailed({ code: progressCode }, e);
      }
    }

    try {
      await progressClient.setAuthorizationStrategy({
        authorizationStrategy: "uuIdentityList",
        permissionMap: await this._getClearProgressPermissionMap(awid, awidInitiatorList, session),
        force: true,
      });
    } catch (e) {
      if (e.cause?.code !== ProgressConstants.PROGRESS_HAS_SAME_AUTH_STRATEGY) {
        throw new Errors._clearFinalize.ProgressSetAuthorizationStrategyCallFailed({ code: progressCode }, e);
      }
    }
  }

  async _getClearProgressPermissionMap(awid, awidInitiatorList, sysIdentitySession) {
    const awidData = await UuAppWorkspace.get(awid);

    let permissionMap = {};
    for (let identity of Array.from(new Set([...awidData.awidInitiatorList, ...awidInitiatorList]))) {
      permissionMap[identity] = CiprMainConstants.CONSOLE_BOUND_MATRIX.Authorities;
    }
    permissionMap[sysIdentitySession.getIdentity().getUuIdentity()] =
      CiprMainConstants.CONSOLE_BOUND_MATRIX.Authorities;

    return permissionMap;
  }

  async _deleteProgress(progressCode, uuConsoleBaseUri, session) {
    let progressClient;

    try {
      progressClient = await ProgressClient.get(uuConsoleBaseUri, { code: progressCode }, { session });
    } catch (e) {
      if (e.cause?.code === ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        return;
      } else {
        throw new Errors.Clear.ProgressGetCallFailed({ code: progressCode }, e);
      }
    }

    try {
      await progressClient.setState({ state: "final" });
      await progressClient.delete();
    } catch (e) {
      DtoBuilder.addWarning(new Warnings._clearFinalize.FailedToDeleteProgress(e.parameters));
    }
  }

  async _clearConsole(uuConsoleBaseUri, consoleCode, session) {
    const consoleClient = new ConsoleClient(uuConsoleBaseUri, { code: consoleCode }, { session });

    try {
      await consoleClient.clear();
    } catch (e) {
      DtoBuilder.addWarning(new Warnings._clearFinalize.FailedToClearConsole({ code: consoleCode }));
    }
  }

  async _runScript(appUri, dtoIn, configuration, lockSecret, session) {
    const scriptEngineClient = new ScriptEngineClient({
      scriptEngineUri: configuration.uuScriptEngineBaseUri,
      consoleUri: configuration.uuConsoleBaseUri,
      consoleCode: CiprMainConstants.getMainConsoleCode(appUri.getAwid()),
      scriptRepositoryUri: configuration.uuScriptRepositoryBaseUri,
      session,
    });

    const scriptDtoIn = {
      uuCiprUri: appUri.toString(),
      awidInitiatorList: dtoIn.data.awidInitiatorList,
      lockSecret,
    };

    await scriptEngineClient.runScript({ scriptCode: SCRIPT_CODE, scriptDtoIn });
  }
}

module.exports = new ClearAbl();
