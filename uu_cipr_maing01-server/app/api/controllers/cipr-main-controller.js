"use strict";
const InitAbl = require("../../abl/cipr-main/init-abl.js");
const InitRollbackAbl = require("../../abl/cipr-main/init-rollback-abl.js");
const LoadAbl = require("../../abl/cipr-main/load-abl.js");
const SetStateClosedAbl = require("../../abl/cipr-main/set-state-closed-abl.js");
const ClearAbl = require("../../abl/cipr-main/clear-abl.js");
const CommenceAbl = require("../../abl/cipr-main/commence-abl.js");

class CiprMainController {
  init(ucEnv) {
    return InitAbl.init(ucEnv.getUri(), ucEnv.getDtoIn());
  }

  _initFinalize(ucEnv) {
    return InitAbl._initFinalize(ucEnv.getUri(), ucEnv.getDtoIn());
  }

  _initFinalizeRollback(ucEnv) {
    return InitRollbackAbl._initFinalizeRollback(ucEnv.getUri(), ucEnv.getDtoIn());
  }

  load(ucEnv) {
    return LoadAbl.load(ucEnv.getUri(), ucEnv.getSession(), ucEnv.getAuthorizationResult());
  }

  loadBasicData(ucEnv) {
    return LoadAbl.loadBasicData(ucEnv.getUri(), ucEnv.getSession());
  }

  setStateClosed(ucEnv) {
    return SetStateClosedAbl.setStateClosed(ucEnv.getUri(), ucEnv.getDtoIn());
  }

  _setStateClosedFinalize(ucEnv) {
    return SetStateClosedAbl._setStateClosedFinalize(ucEnv.getUri(), ucEnv.getDtoIn());
  }

  clear(ucEnv) {
    return ClearAbl.clear(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }

  _clearFinalize(ucEnv) {
    return ClearAbl._clearFinalize(ucEnv.getUri(), ucEnv.getDtoIn(), ucEnv.getSession());
  }

  commence(ucEnv) {
    return CommenceAbl.commence(ucEnv.getUri(), ucEnv.getDtoIn());
  }
}

module.exports = new CiprMainController();
