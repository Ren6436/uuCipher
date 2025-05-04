/* eslint-disable */
const decryptCreateDtoInType = shape({
  data: shape({
    value: shape({
      value: string(1000),
      key: string(1000),
    }).isRequired()
  }).isRequired()
});
  