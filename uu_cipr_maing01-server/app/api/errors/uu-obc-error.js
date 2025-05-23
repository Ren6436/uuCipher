"use strict";
const CiprMainUseCaseError = require("./cipr-main-use-case-error.js");

class UuObcCreateFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuObcCreateFailed", "Failed to create uuObc.", paramMap, cause);
  }
}

class UuObcLoadFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuObcLoadFailed", "Failed to load uuObc.", paramMap, cause);
  }
}

class UuArtifactIfcLoadDataFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuArtifactIfcLoadDataFailed", "Failed to call uuArtifactIfc/loadLoad.", paramMap, cause);
  }
}

class UuObcSetStateFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuObcSetStateFailed", "The uuObc set state failed.", paramMap, cause);
  }
}

class UuObcSetBasicAttributesFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuObcSetBasicAttributesFailed", "The uuObc set basic attributes failed.", paramMap, cause);
  }
}

class UuObcDeleteFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuObcDeleteFailed", "The uuObc delete failed", paramMap, cause);
  }
}

class UuObcMoveToTrashFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuObcMoveToTrashFailed", "The uuObc move to trash failed.", paramMap, cause);
  }
}

class UuObcRestoreFromTrashFailed extends CiprMainUseCaseError {
  constructor(paramMap = {}, cause = null) {
    super("uuObcRestoreFromTrashFailed", "The uuObc restore from trash.", paramMap, cause);
  }
}

module.exports = {
  UuObcCreateFailed,
  UuObcLoadFailed,
  UuObcSetStateFailed,
  UuObcSetBasicAttributesFailed,
  UuObcDeleteFailed,
  UuObcMoveToTrashFailed,
  UuObcRestoreFromTrashFailed,
  UuArtifactIfcLoadDataFailed,
};
