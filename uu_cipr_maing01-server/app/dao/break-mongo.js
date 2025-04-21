const { UuObjectDao } = require("uu_appg01_server").ObjectStore;

class BreaksMongo extends UuObjectDao {
  async createSchema() {
    await super.createIndex({ awid: 1, code: 1 }, { unique: true });
  }

  async create(breaks) {
    return await super.insertOne(breaks);
  }
}

module.exports = BreaksMongo;
