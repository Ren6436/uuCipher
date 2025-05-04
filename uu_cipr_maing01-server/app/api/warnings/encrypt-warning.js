const Errors = require("../../api/errors/encrypt-errors.js");

const Warnings = {
  Create: {
    UnsupportedKeys: {
      code: `${Errors.Create.UC_CODE}unsupportedKeys`,
    },
  },
};

module.exports = Warnings;
