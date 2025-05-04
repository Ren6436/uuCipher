const { UuObjectDao } = require("uu_appg01_server").ObjectStore;

class EncryptMongo extends UuObjectDao {
  async createShema() {
    await super.createIndex({ awid: 1, code: 1 }, { unique: true });
  }

  async create(encrypt) {
    return await super.insertOne(encrypt);
  }
}

module.exports = EncryptMongo;
