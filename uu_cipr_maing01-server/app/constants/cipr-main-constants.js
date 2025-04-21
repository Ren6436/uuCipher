"use strict";

//@@viewOn:constants
const CiprMainConstants = {
  AWSC_PREFIX: "uu-cipr",
  CONSOLE_PREFIX: "cipr",
  ERROR_PREFIX: "uu-cipr-main",
  INIT_PROGRESS_CODE_PREFIX: "uu-cipr-maing01-progress-init-",
  INIT_PROGRESS_NAME_PREFIX: "uuCipr Init ",
  SET_STATE_CLOSED_PROGRESS_CODE_PREFIX: "uu-cipr-maing01-progress-setStateClosed-",
  SET_STATE_CLOSED_PROGRESS_NAME_PREFIX: "uuCipr Set State Closed ",
  CLEAR_PROGRESS_CODE_PREFIX: "uu-cipr-maing01-progress-clear-",
  CLEAR_PROGRESS_NAME_PREFIX: "uuCipr Clear ",
  UUAPP_CODE: "uu-cipr-maing01",

  CONFIG_CACHE_KEY: "configuration",
  UU_APP_ERROR_MAP: "uuAppErrorMap",

  // This is bound matrix of uuAwsc and uuConsole which has authorization bounded to that uuAwsc.
  CONSOLE_BOUND_MATRIX: {
    Authorities: ["Authorities", "Readers", "Writers"],
    Operatives: ["Readers", "Writers"],
    Auditors: ["Readers"],
    SystemIdentity: ["Authorities", "Readers", "Writers"],
  },

  InitStepMap: {
    CIPR_OBJECT_CREATED: { code: "uuCiprObjectCreated", message: "The uuObject of uuCipr created." },
    AWSC_CREATED: { code: "uuAwscCreated", message: "The uuAwsc of uuCipr created." },
    WS_CONNECTED: { code: "uuAppWorkspaceConnected", message: "The uuCipr uuAppWorkspace connected." },
    CONSOLE_CREATED: { code: "consoleCreated", message: "The console of uuCipr created." },
    PROGRESS_ENDED: { code: "progressEnded", message: "The progress has been ended." },
    WS_ACTIVE: { code: "uuAppWorkspaceActiveState", message: "The uuAppWorkspace of uuCipr set to active state." },
  },

  InitRollbackStepMap: {
    CONSOLE_CLEARED: { code: "consoleCleared", message: "The uuCipr console has been cleared." },
    WS_DISCONNECTED: { code: "uuAppWorkspaceDisonnected", message: "The uuCipr uuAppWorkspace disconnected." },
    AWSC_DELETED: { code: "uuAwscDeleted", message: "The uuAwsc of uuCipr deleted." },
    PROGRESS_DELETED: { code: "progressDeleted", message: "The progress has been deleted." },
  },

  SetStateClosedStepMap: {
    CLOSE_STARTED: { code: "setStateClosedStarted", message: "SetStateClosed has started." },
    AWSC_CLOSED: { code: "uuAwscClosed", message: "The uuObject of uuCipr set to closed state." },
    PROGRESS_ENDED: { code: "progressEnded", message: "The progress has been ended." },
  },

  ClearStepMap: {
    CLEAR_STARTED: { code: "clearStarted", message: "Clear has started." },
    INIT_PROGRESS_DELETED: { code: "initProgressDeleted", message: "The init progress has been deleted." },
    SET_STATE_CLOSED_PROGRESS_DELETED: {
      code: "setStateClosedProgressDeleted",
      message: "The setStateClosed progress has been deleted.",
    },
    CONSOLE_CLEARED: { code: "consoleCleared", message: "The uuCipr console has been cleared." },
    PROGRESS_AUTH_STRATEGY_SET: {
      code: "progressAuthorizationStrategySet",
      message: "The authorization strategy of progress has been set to roleGroupInterface.",
    },
    AUTH_STRATEGY_SET: {
      code: "authorizationStrategySet",
      message: "The authorization strategy has been set to roleGroupInterface.",
    },
    AWSC_DELETED: { code: "uuAwscDeleted", message: "The uuAwsc of uuCipr deleted." },
    PROGRESS_ENDED: { code: "progressEnded", message: "The progress has been ended." },
  },

  ModeMap: {
    STANDARD: "standard",
    RETRY: "retry",
    ROLLBACK: "rollback",
  },

  ProfileMask: {
    STANDARD_USER: parseInt("00010000000000000000000000000000", 2),
  },

  PropertyMap: {
    CONFIG: "config",
    SCRIPT_CONFIG: "scriptConfig",
    CIPR_CONFIG: "uuCiprConfig",
  },

  Schemas: {
    CIPR_INSTANCE: "ciprMain",
  },

  SharedResources: {
    SCRIPT_CONSOLE: "uu-console-maing02",
    SCRIPT_ENGINE: "uu-script-engineg02",
  },

  StateMap: {
    CREATED: "created",
    BEING_INITIALIZED: "beingInitialized",
    ACTIVE: "active",
    FINAL: "closed",
  },

  getMainConsoleCode: (awid) => {
    return `uu-cipr-maing01-console-${awid}`;
  },

  getInitProgressCode: (awid) => {
    return `${CiprMainConstants.INIT_PROGRESS_CODE_PREFIX}${awid}`;
  },

  getInitProgressName: (awid) => {
    return `${CiprMainConstants.INIT_PROGRESS_NAME_PREFIX}${awid}`;
  },

  getSetStateClosedProgressName: (awid) => {
    return `${CiprMainConstants.SET_STATE_CLOSED_PROGRESS_NAME_PREFIX}${awid}`;
  },

  getSetStateClosedProgressCode: (awid) => {
    return `${CiprMainConstants.SET_STATE_CLOSED_PROGRESS_CODE_PREFIX}${awid}`;
  },

  getClearProgressName: (awid) => {
    return `${CiprMainConstants.CLEAR_PROGRESS_NAME_PREFIX}${awid}`;
  },

  getClearProgressCode: (awid) => {
    return `${CiprMainConstants.CLEAR_PROGRESS_CODE_PREFIX}${awid}`;
  },

  getInitStepCount: () => {
    return Object.keys(CiprMainConstants.InitStepMap).length;
  },

  getInitRollbackStepCount: () => {
    return Object.keys(CiprMainConstants.InitRollbackStepMap).length;
  },

  getSetStateClosedStepCount: () => {
    return Object.keys(CiprMainConstants.SetStateClosedStepMap).length;
  },

  getClearStepCount: () => {
    return Object.keys(CiprMainConstants.ClearStepMap).length;
  },
};
//@@viewOff:constants

//@@viewOn:exports
module.exports = CiprMainConstants;
//@@viewOff:exports
