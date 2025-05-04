/* eslint-disable */
const breakCreateDtoInType = shape({
  data: shape({
    value: shape({
      value: string(1000),
    }).isRequired()
  }).isRequired()
});