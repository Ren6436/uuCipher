const { TestHelper } = require("uu_script_devkitg01");

describe("CiprMainInit", () => {
  test("HDS", async () => {
    const session = await TestHelper.login();

    const dtoIn = {};

    const result = await TestHelper.runScript("cipr-main/init.js", dtoIn, session);
    expect(result.isError).toEqual(false);
  });
});
