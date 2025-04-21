"use strict";
const { UseCaseContext } = require("uu_appg01_server").AppServer;
const { DaoFactory } = require("uu_appg01_server").ObjectStore;
const { UuTerrClient } = require("uu_territory_clientg01");

const TerritoryConstants = require("../constants/territory-constants");
const DtoBuilder = require("./dto-builder");
const { CiprMain: Errors } = require("../api/errors/cipr-main-error");
const Warnings = require("../api/warnings/cipr-main-warning");
const CiprMainConstants = require("../constants/cipr-main-constants");

class CiprMainClient {
  constructor(uuCipr, territoryUri = null, session = null) {
    this.dao = DaoFactory.getDao(CiprMainConstants.Schemas.CIPR_INSTANCE);
    this.uuCipr = uuCipr;
    this.uri = UseCaseContext.getUri();
    this.territoryUri = territoryUri ? territoryUri : uuCipr.uuTerritoryBaseUri;
    this.session = session ? session : UseCaseContext.getSession();
  }

  async createAwsc(location, responsibleRole, permissionMatrix, uuAppMetaModelVersion) {
    const appClientOpts = this.getAppClientOpts();
    const { name, desc } = this.uuCipr;
    const awscCreateDtoIn = {
      name,
      desc,
      code: `${CiprMainConstants.AWSC_PREFIX}/${this.uuCipr.awid}`,
      location,
      responsibleRole,
      permissionMatrix,
      typeCode: CiprMainConstants.UUAPP_CODE,
      uuAppWorkspaceUri: this.uri.getBaseUri(),
      uuAppMetaModelVersion,
    };

    let awsc;
    try {
      awsc = await UuTerrClient.Awsc.create(awscCreateDtoIn, appClientOpts);
    } catch (e) {
      const awscCreateErrorMap = (e.dtoOut && e.dtoOut.uuAppErrorMap) || {};

      const isDup =
        awscCreateErrorMap[TerritoryConstants.AWSC_CREATE_FAILED_CODE] &&
        awscCreateErrorMap[TerritoryConstants.AWSC_CREATE_FAILED_CODE].cause &&
        awscCreateErrorMap[TerritoryConstants.AWSC_CREATE_FAILED_CODE].cause[TerritoryConstants.NOT_UNIQUE_ID_CODE];

      if (isDup) {
        DtoBuilder.addWarning(new Warnings.Init.UuAwscAlreadyCreated());
        awsc = await UuTerrClient.Awsc.get(
          { code: `${CiprMainConstants.AWSC_PREFIX}/${this.uuCipr.awid}` },
          appClientOpts,
        );
      } else {
        DtoBuilder.addUuAppErrorMap(awscCreateErrorMap);
        throw new Errors.CreateAwscFailed(
          { uuTerritoryBaseUri: this.uuCipr.uuTerritoryBaseUri, awid: this.uuCipr.awid },
          e,
        );
      }
    }

    this.uuCipr = await this.dao.updateByAwid({
      awid: this.uuCipr.awid,
      artifactId: awsc.id,
    });

    return this.uuCipr;
  }

  async loadAwsc() {
    const appClientOpts = this.getAppClientOpts();

    let awsc;
    try {
      awsc = await UuTerrClient.Awsc.load({ id: this.uuCipr.artifactId }, appClientOpts);
    } catch (e) {
      throw new Errors.LoadAwscFailed({ artifactId: this.uuCipr.artifactId }, e);
    }

    return awsc;
  }

  async setAwscState(state) {
    const appClientOpts = this.getAppClientOpts();
    try {
      await UuTerrClient.Awsc.setState(
        {
          id: this.uuCipr.artifactId,
          state,
        },
        appClientOpts,
      );
    } catch (e) {
      throw new Errors.SetAwscStateFailed({ state, id: this.uuCipr.artifactId }, e);
    }
  }

  async deleteAwsc() {
    const appClientOpts = this.getAppClientOpts();
    try {
      await UuTerrClient.Awsc.delete({ id: this.uuCipr.artifactId }, appClientOpts);
    } catch (e) {
      if (e.cause?.code !== TerritoryConstants.ARTIFACT_DOES_NOT_EXIST) {
        throw new Errors.DeleteAwscFailed({ id: this.uuCipr.artifactId }, e);
      }
    }
  }

  getAppClientOpts() {
    return { baseUri: this.territoryUri, session: this.session, appUri: this.uri };
  }
}

module.exports = CiprMainClient;
