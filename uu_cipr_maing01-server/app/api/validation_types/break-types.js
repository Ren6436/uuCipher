/* eslint-disable */
const breakCreateDtoInType = shape({
  value: shape({
    value: string(1000).isRequired()
  }),
  file: binary()
});
