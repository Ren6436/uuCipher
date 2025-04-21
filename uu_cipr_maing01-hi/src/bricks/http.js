const BASE_URL = "http://localhost:8080";

export function respon(url, data) {
  //@@viewOn:private
  const formData = new FormData();
  formData.append("text", data.text);

  if (data.file) {
    formData.append("file", data.file);
  }
  //@@viewOff:private

  //@@viewOn:render
  return fetch(BASE_URL + url, {
    method: "POST",
    body: formData,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    return response.text();
  });
  //@@viewOff:render
}
