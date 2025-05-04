/* eslist-disable */
const encryptCreateDtoInType = shape({
  data: shape({
    value: shape({
      value: string(1000),
      file: any()
    }).isRequired()
  }).isRequired()
});
