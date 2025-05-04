const { UuObjectDao } = require("uu_appg01_server").ObjectStore;

class DecryptMongo extends UuObjectDao {
  async createShema() {
    await super.createIndex({ awid: 1, code: 1 }, { unique: true });
  }

  async create(decrypt) {
    return await super.insertOne(decrypt);
  }
}

module.exports = DecryptMongo;
