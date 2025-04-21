"use strict";
const CiprMainUseCaseWarning = require("./cipr-main-use-case-warning.js");

const Warnings = {
  Init: {
    UuAwscAlreadyCreated: class extends CiprMainUseCaseWarning {
      constructor(paramMap) {
        super("uuAwscAlreadyCreated", "Step uuAwscCreated skipped, uuAwsc already exists.", paramMap);
      }
    },

    ProgressSetStateCallFailed: class extends CiprMainUseCaseWarning {
      constructor(paramMap = {}) {
        super("progressSetStateCallFailed", "Failed to call progress/setState uuCommand.", paramMap);
      }
    },
  },

  _initFinalize: {
    ConsoleDoesNotExist: class extends CiprMainUseCaseWarning {
      constructor(paramMap) {
        super("consoleDoesNotExist", "Console does not exist.", paramMap);
      }
    },
  },

  _initFinalizeRollback: {
    ConsoleDoesNotExist: class extends CiprMainUseCaseWarning {
      constructor(paramMap) {
        super("consoleDoesNotExist", "Console does not exist.", paramMap);
      }
    },

    UuAwscDoesNotExist: class extends CiprMainUseCaseWarning {
      constructor(paramMap) {
        super("uuAwscDoesNotExist", "uuAwsc does not exist.", paramMap);
      }
    },
  },

  SetStateClosed: {
    ProgressSetStateCallFailed: class extends CiprMainUseCaseWarning {
      constructor(paramMap = {}) {
        super("progressSetStateCallFailed", "Failed to call progress/setState uuCommand.", paramMap);
      }
    },
  },

  _setStateClosedFinalize: {
    AwscAlreadyInFinalState: class extends CiprMainUseCaseWarning {
      constructor(paramMap = {}) {
        super("awscAlreadyInFinalState", "Awsc is already in final state.", paramMap);
      }
    },
  },

  _clearFinalize: {
    FailedToDeleteProgress: class extends CiprMainUseCaseWarning {
      constructor(paramMap = {}) {
        super("failedToDeleteProgress", "Failed to delete progress.", paramMap);
      }
    },

    FailedToClearConsole: class extends CiprMainUseCaseWarning {
      constructor(paramMap = {}) {
        super("failedToClearConsole", "Failed to clear console.", paramMap);
      }
    },
  },
};

module.exports = Warnings;
