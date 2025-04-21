//@@viewOn:imports
import { useState } from "uu5g05";
import "uu5g04-bricks";
import { Form, FormFile, TextArea } from "uu5g05-forms";
import { Box, Button, Label } from "uu5g05-elements";
import { Progress } from "uu5g05";
import { respon } from "../http";
//@@viewOff:imports

export default function Break({ onSubmit = () => {} }) {
  //@@viewOn:state
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorLoadingMessage, setErrorLoadingMessage] = useState("");
  //@@viewOff:state

  //@@viewOn:handlers
  const handleFileChange = (opt) => {
    setSelectedFile(opt.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorLoadingMessage("");
    setResult(null);

    const formPayload = {
      text: inputValue,
      file: selectedFile,
    };

    onSubmit({ type: "breaking", ...formPayload });

    respon("/api/break", formPayload)
      .then((data) => setResult(data))
      .catch(() => setErrorLoadingMessage("Try again later"))
      .finally(() => setLoading(false));
  };

  const reload = () => {
    setErrorLoadingMessage("");
  };
  //@@viewOff:handlers

  //@@viewOn:render
  return (
    <Form onSubmit={handleSubmit}>
      <Box style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
        {/* Text Input */}
        <Label>Enter text</Label>
        <TextArea value={inputValue} onChange={(e) => setInputValue(e.data.value)} required autoResize maxRows={10} />

        {/* File Input - Using UU5 FileInput component */}
        <Label>Add file</Label>
        <FormFile onChange={handleFileChange} />

        {/* Submit Button */}
        <Button colorScheme="primary" onClick={handleSubmit} style={{ width: "100%", marginBottom: 16 }}>
          Break Encryption
        </Button>

        {/* Selected File Info */}
        {selectedFile && (
         <TextArea style={{ marginBottom: 16 }}>
            Selected file: {selectedFile.name}
          </TextArea>
        )}

        {/* Loading Indicator */}
        {loading && (
            <Progress />
        )}

        {/* Result */}
        {!loading && result && (
            <Label>Result:`{result}`</Label>
        )}

        {/* Error Message */}
        {!loading && errorLoadingMessage && (
            <>
            <TextArea colorScheme="negative">
              {errorLoadingMessage}
            </TextArea>
            <Button
              onClick={reload}
              style={{ marginTop: 8 }}
            >
              Retry
            </Button>
          </>
        )}
      </Box>
    </Form>
  );
  //@@viewOff:render
}