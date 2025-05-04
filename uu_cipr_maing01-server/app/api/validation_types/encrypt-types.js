/* eslist-disable */
const encryptCreateDtoInType = shape({
  data: shape({
    value: shape({
      value: string(1000),
    }).isRequired()
  }).isRequired()
});
