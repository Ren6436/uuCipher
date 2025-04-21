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
const InitRollbackAbl = require("./init-rollback-abl");

const ConsoleConstants = require("../../constants/console-constants");
const ProgressConstants = require("../../constants/progress-constants");
const CiprMainConstants = require("../../constants/cipr-main-constants");
const Configuration = require("../../components/configuration");

const SCRIPT_CODE = "uu_cipr_maing01-uuscriptlib/cipr-main/init";

class InitAbl {
  constructor() {
    this.dao = DaoFactory.getDao(CiprMainConstants.Schemas.CIPR_INSTANCE);
  }

  async init(uri, dtoIn) {
    // HDS 1
    const awid = uri.getAwid();
    this._validateDtoIn(uri, dtoIn);

    // HDS 2
    let uuCipr = await this.dao.getByAwid(awid);
    let uuAppWorkspace = await UuAppWorkspace.get(awid);

    // HDS 3
    this._validateMode(uuCipr, dtoIn, uuAppWorkspace.sysState);

    // HDS 4
    const configuration = await Configuration.getUuSubAppConfiguration({
      awid,
      artifactId: dtoIn.data.locationId || uuCipr.temporaryData.dtoIn.locationId,
      uuTerritoryBaseUri: dtoIn.data.uuTerritoryBaseUri || uuCipr.temporaryData.dtoIn.uuTerritoryBaseUri,
    });

    // HDS 5
    let initData;
    switch (dtoIn.mode) {
      case CiprMainConstants.ModeMap.STANDARD: {
        initData = dtoIn.data;
        const uuTerritoryBaseUri = this._parseTerritoryUri(initData.uuTerritoryBaseUri);
        const temporaryData = {
          useCase: uri.getUseCase(),
          dtoIn: { ...initData },
          stepList: [CiprMainConstants.InitStepMap.CIPR_OBJECT_CREATED.code],
          progressMap: {
            uuConsoleUri: configuration.uuConsoleBaseUri,
            progressCode: CiprMainConstants.getInitProgressCode(awid),
            consoleCode: CiprMainConstants.getMainConsoleCode(awid),
          },
        };

        uuCipr = await this.dao.create({
          awid,
          state: CiprMainConstants.StateMap.CREATED,
          code: `${CiprMainConstants.AWSC_PREFIX}/${awid}`,
          uuTerritoryBaseUri: uuTerritoryBaseUri.toString(),
          name: initData.name,
          desc: initData.desc,
          temporaryData,
        });

        try {
          await UuAppWorkspace.setBeingInitializedSysState(awid);
        } catch (e) {
          throw new Errors.Init.SetBeingInitializedSysStateFailed({}, e);
        }
        break;
      }

      case CiprMainConstants.ModeMap.RETRY: {
        initData = uuCipr.temporaryData.dtoIn;
        break;
      }

      case CiprMainConstants.ModeMap.ROLLBACK: {
        uuCipr.temporaryData.rollbackMode = true;
        if (!uuCipr.temporaryData.rollbackStepList) {
          uuCipr.temporaryData.rollbackStepList = [];
        }
        uuCipr = await this.dao.updateByAwid({ ...uuCipr });
        initData = uuCipr.temporaryData.dtoIn;
        break;
      }

      default: {
        throw new Errors.Init.WrongModeAndCircumstances({
          mode: dtoIn.mode,
          appObjectState: uuCipr?.state,
          temporaryData: uuCipr?.temporaryData,
        });
      }
    }

    // HDS 6
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const lockSecret = Crypto.randomBytes(32).toString("hex");
    const progressClient = await this._createInitProgress(
      uuCipr,
      dtoIn,
      configuration,
      lockSecret,
      sysIdentitySession,
    );

    // HDS 7
    switch (dtoIn.mode) {
      case CiprMainConstants.ModeMap.STANDARD:
      case CiprMainConstants.ModeMap.RETRY: {
        const stepHandler = new StepHandler({
          schema: CiprMainConstants.Schemas.CIPR_INSTANCE,
          progressClient,
          stepList: uuCipr?.temporaryData?.stepList,
        });

        const ciprMainClient = new CiprMainClient(uuCipr, uuCipr.uuTerritoryBaseUri);

        uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.InitStepMap.AWSC_CREATED, async () => {
          uuCipr.state = CiprMainConstants.StateMap.BEING_INITIALIZED;
          await this.dao.updateByAwid({ ...uuCipr });
          await ciprMainClient.createAwsc(
            initData.locationId,
            initData.responsibleRoleId,
            initData.permissionMatrix,
            configuration.uuAppMetaModelVersion,
          );
        });

        uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.InitStepMap.WS_CONNECTED, async () => {
          await this._connectAwsc(uuCipr, uri.getBaseUri(), uuCipr.uuTerritoryBaseUri, sysIdentitySession);
        });

        uuCipr = await stepHandler.handleStep(uuCipr, CiprMainConstants.InitStepMap.CONSOLE_CREATED, async () => {
          await this._createConsole(uuCipr, configuration, sysIdentitySession);
        });

        // TODO If your application requires any additional steps, add them here...

        if (!uuCipr.temporaryData.stepList.includes(CiprMainConstants.InitStepMap.PROGRESS_ENDED.code)) {
          await this._runScript(uri.getBaseUri(), configuration, lockSecret, sysIdentitySession);
        } else {
          await this._initFinalize(uri, { lockSecret });
        }
        break;
      }

      case CiprMainConstants.ModeMap.ROLLBACK: {
        if (
          uuCipr.temporaryData.stepList.includes(CiprMainConstants.InitStepMap.CONSOLE_CREATED.code) &&
          !uuCipr.temporaryData.rollbackStepList.includes(CiprMainConstants.InitRollbackStepMap.CONSOLE_CLEARED.code)
        ) {
          await InitRollbackAbl.initRollback(uri.getBaseUri(), configuration, lockSecret);
        } else {
          await InitRollbackAbl._initFinalizeRollback(uri, { lockSecret });
        }
        break;
      }

      default: {
        throw new Errors.Init.WrongModeAndCircumstances({
          mode: dtoIn.mode,
          appObjectState: uuCipr?.state,
          temporaryData: uuCipr?.temporaryData,
        });
      }
    }

    // HDS 8
    return DtoBuilder.prepareDtoOut({ data: uuCipr });
  }

  async _initFinalize(uri, dtoIn) {
    // HDS 1
    const awid = uri.getAwid();
    Validator.validateDtoInCustom(uri, dtoIn, "sysUuAppWorkspaceInitFinalizeDtoInType");

    // HDS 2
    let uuCipr = await this.dao.getByAwid(awid);

    if (!uuCipr) {
      // 2.1
      throw new Errors._initFinalize.UuCiprDoesNotExist({ awid });
    }

    if (![CiprMainConstants.StateMap.BEING_INITIALIZED, CiprMainConstants.StateMap.ACTIVE].includes(uuCipr.state)) {
      // 2.2
      throw new Errors._initFinalize.NotInProperState({
        state: uuCipr.state,
        expectedStateList: [CiprMainConstants.StateMap.BEING_INITIALIZED, CiprMainConstants.StateMap.ACTIVE],
      });
    }

    // HDS 3
    const sysIdentitySession = await AuthenticationService.authenticateSystemIdentity();
    const progress = {
      code: CiprMainConstants.getInitProgressCode(uuCipr.awid),
      lockSecret: dtoIn.lockSecret,
    };
    let progressClient = null;
    if (!uuCipr.temporaryData.stepList.includes(CiprMainConstants.InitStepMap.PROGRESS_ENDED.code)) {
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
    uuCipr = await stepHandler.handleStep(
      uuCipr,
      CiprMainConstants.InitStepMap.PROGRESS_ENDED,
      async () => {
        await progressClient.end({
          state: ProgressConstants.StateMap.COMPLETED,
          message: "Initialization finished.",
          doneWork: CiprMainConstants.getInitStepCount(),
        });
      },
      false,
    );

    // HDS 5
    if (uuCipr.state === CiprMainConstants.StateMap.BEING_INITIALIZED) {
      uuCipr = await this.dao.updateByAwid({ awid, state: CiprMainConstants.StateMap.ACTIVE, temporaryData: null });
    }

    // HDS 6
    await UuAppWorkspace.setActiveSysState(awid);

    // HDS 7
    return DtoBuilder.prepareDtoOut({ data: uuCipr });
  }

  // Validates dtoIn. In case of standard mode the data key of dtoIn is also validated.
  _validateDtoIn(uri, dtoIn) {
    let uuAppErrorMap = Validator.validateDtoIn(uri, dtoIn);
    if (dtoIn.mode === CiprMainConstants.ModeMap.STANDARD) {
      Validator.validateDtoInCustom(uri, dtoIn.data, "sysUuAppWorkspaceInitStandardDtoInType", uuAppErrorMap);
    }
    return uuAppErrorMap;
  }

  _validateMode(uuCipr, dtoIn, sysState) {
    switch (dtoIn.mode) {
      case CiprMainConstants.ModeMap.STANDARD:
        if (![UuAppWorkspace.SYS_STATES.ASSIGNED, UuAppWorkspace.SYS_STATES.BEING_INITIALIZED].includes(sysState)) {
          // 3.A.1.1.
          throw new Errors.Init.SysUuAppWorkspaceIsNotInProperState({
            sysState,
            expectedSysStateList: [UuAppWorkspace.SYS_STATES.ASSIGNED, UuAppWorkspace.SYS_STATES.BEING_INITIALIZED],
          });
        }
        if (uuCipr) {
          // 3.A.2.1.
          throw new Errors.Init.UuCiprObjectAlreadyExist({
            mode: dtoIn.mode,
            allowedModeList: [CiprMainConstants.ModeMap.RETRY, CiprMainConstants.ModeMap.ROLLBACK],
          });
        }
        break;

      case CiprMainConstants.ModeMap.RETRY:
        if (sysState !== UuAppWorkspace.SYS_STATES.BEING_INITIALIZED) {
          // 3.B.1.1.
          throw new Errors.Init.SysUuAppWorkspaceIsNotInProperState({
            sysState,
            expectedSysStateList: [UuAppWorkspace.SYS_STATES.BEING_INITIALIZED],
          });
        }
        if (!uuCipr?.temporaryData) {
          // 3.B.2.1.
          throw new Errors.Init.MissingRequiredData();
        }
        if (uuCipr?.temporaryData?.rollbackMode) {
          // 3.B.3.1.
          throw new Errors.Init.RollbackNotFinished();
        }
        break;

      case CiprMainConstants.ModeMap.ROLLBACK:
        if (sysState !== UuAppWorkspace.SYS_STATES.BEING_INITIALIZED) {
          // 3.C.1.1.
          throw new Errors.Init.SysUuAppWorkspaceIsNotInProperState({
            sysState,
            expectedSysStateList: [UuAppWorkspace.SYS_STATES.BEING_INITIALIZED],
          });
        }
        if (!uuCipr?.temporaryData) {
          // 3.C.2.1.
          throw new Errors.Init.MissingRequiredData();
        }
        if (!dtoIn.force && uuCipr?.temporaryData?.rollbackMode) {
          // 3.C.3.1.
          throw new Errors.Init.RollbackAlreadyRunning();
        }
        break;
    }
  }

  _parseTerritoryUri(locationUri) {
    let uuTerritoryUri;

    try {
      uuTerritoryUri = UriBuilder.parse(locationUri).toUri();
    } catch (e) {
      throw new Errors.Init.UuTLocationUriParseFailed({ uri: locationUri }, e);
    }

    return uuTerritoryUri.getBaseUri();
  }

  async _createInitProgress(uuCipr, dtoIn, config, lockSecret, session) {
    let progressClient;
    let progress = {
      expireAt: UuDateTime.now().shiftDay(7),
      name: CiprMainConstants.getInitProgressName(uuCipr.awid),
      code: CiprMainConstants.getInitProgressCode(uuCipr.awid),
      authorizationStrategy: "uuIdentityList",
      permissionMap: await this._getInitProgressPermissionMap(uuCipr.awid, session),
      lockSecret,
    };

    try {
      progressClient = await ProgressClient.get(config.uuConsoleBaseUri, { code: progress.code }, { session });
    } catch (e) {
      if (e.cause?.code !== ProgressConstants.PROGRESS_DOES_NOT_EXIST) {
        throw new Errors.Init.ProgressGetCallFailed({ progressCode: progress.code }, e);
      }
    }

    if (!progressClient) {
      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Init.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    } else if (dtoIn.force) {
      try {
        await progressClient.releaseLock();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_RELEASE_DOES_NOT_EXIST) {
          throw new Errors.Init.ProgressReleaseLockCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        await progressClient.setState({ state: "cancelled" });
      } catch (e) {
        DtoBuilder.addWarning(new Warnings.Init.ProgressSetStateCallFailed(e.cause?.paramMap));
      }

      try {
        await progressClient.delete();
      } catch (e) {
        if (e.cause?.code !== ProgressConstants.PROGRESS_DELETE_DOES_NOT_EXIST) {
          throw new Errors.Init.ProgressDeleteCallFailed({ progressCode: progress.code }, e);
        }
      }

      try {
        progressClient = await ProgressClient.createInstance(config.uuConsoleBaseUri, progress, { session });
      } catch (e) {
        throw new Errors.Init.ProgressCreateCallFailed({ progressCode: progress.code }, e);
      }
    }

    try {
      await progressClient.start({
        message: "Progress was started",
        totalWork:
          dtoIn.mode === CiprMainConstants.ModeMap.ROLLBACK
            ? CiprMainConstants.getInitRollbackStepCount()
            : CiprMainConstants.getInitStepCount(),
        lockSecret,
      });
    } catch (e) {
      throw new Errors.Init.ProgressStartCallFailed({ progressCode: progress.code }, e);
    }

    return progressClient;
  }

  async _getInitProgressPermissionMap(awid, sysIdentitySession) {
    const awidData = await UuAppWorkspace.get(awid);

    let permissionMap = {};
    for (let identity of awidData.awidInitiatorList) {
      permissionMap[identity] = CiprMainConstants.CONSOLE_BOUND_MATRIX.Authorities;
    }
    permissionMap[sysIdentitySession.getIdentity().getUuIdentity()] =
      CiprMainConstants.CONSOLE_BOUND_MATRIX.Authorities;

    return permissionMap;
  }

  async _connectAwsc(uuCipr, appUri, uuTerritoryBaseUri, session) {
    const artifactUri = UriBuilder.parse(uuTerritoryBaseUri).setParameter("id", uuCipr.artifactId).toUri().toString();

    try {
      await UuAppWorkspace.connectArtifact(appUri, { artifactUri }, session);
    } catch (e) {
      throw new Errors.CiprMain.ConnectAwscFailed(
        {
          awid: uuCipr.awid,
          awscId: uuCipr.artifactId,
          uuTerritoryBaseUri,
        },
        e,
      );
    }
  }

  async _createConsole(uuCipr, configuration, session) {
    const artifactUri = UriBuilder.parse(uuCipr.uuTerritoryBaseUri).setParameter("id", uuCipr.artifactId).toString();
    const console = {
      code: CiprMainConstants.getMainConsoleCode(uuCipr.awid),
      authorizationStrategy: "boundArtifact",
      boundArtifactUri: artifactUri,
      boundArtifactPermissionMatrix: CiprMainConstants.CONSOLE_BOUND_MATRIX,
    };

    try {
      await ConsoleClient.createInstance(configuration.uuConsoleBaseUri, console, { session });
    } catch (e) {
      throw new Errors.Init.FailedToCreateConsole({}, e);
    }
  }

  async _setConsoleExpiration(uuConsoleUri, consoleCode, session) {
    let consoleClient;
    try {
      consoleClient = await ConsoleClient.get(uuConsoleUri, { code: consoleCode }, { session });
    } catch (e) {
      if (e.cause?.code === ConsoleConstants.CONSOLE_GET_DOES_NOT_EXISTS) {
        throw new Errors._initFinalize.ConsoleGetCallFailed({ code: consoleCode }, e);
      }
    }

    try {
      await consoleClient.update({ expireAt: new UuDateTime().shiftDay(7).date });
    } catch (e) {
      if (e.cause?.code === ConsoleConstants.CONSOLE_UPDATE_DOES_NOT_EXISTS) {
        DtoBuilder.addWarning(new Warnings._initFinalize.ConsoleDoesNotExist({ code: consoleCode }));
      } else {
        throw new Errors._initFinalize.ConsoleUpdateCallFailed({ code: consoleCode }, e);
      }
    }
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

module.exports = new InitAbl();
