//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import { Box, useAlertBus } from "uu5g05-elements";
import { Form, SubmitButton, FormFile, FormTextArea, TextArea, ResetButton } from "uu5g05-forms";
import Config from "../config/config";
import Calls from "../../../calls";
//@@viewOff:imports

const Encrypt = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Encrypt",
  //@@viewOff:statics


  render(props) {
    //@@viewOn:render
    const { addAlert } = useAlertBus();
    const [result, setResult] = useState(null);

    async function handleSubmit(values) {
      try {
        const res = await Calls.encryptCreate(values);
        const cipherText = res.data?.result?.cipherText ?? "";
        const key = res.data?.result?.key ?? "";

        setResult({ cipherText, key });


        addAlert({
          message: "Encrytion successful",
          prioryty: "success",
          durationMs: 2000,
        });

        return res;
      } catch (error) {
        setResult(null);
        addAlert({
          message: "Encryption failed: " + error.message,
          priority: "error",
          durationMs: 3000,
        });
        throw error;
      }
    }

    function handleResetClick() {
      setResult(null);
    }

    return (
      <Box style={{ width: 640, padding: 20 }}>
        <Form onSubmit={handleSubmit}>
          <FormTextArea
            name="value"
            label="Text to encrypt"
            placeholder="Paste your text here"
            autoResize={true}
          />
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            paddingTop: 16,
            gap: 8
          }}>
            <ResetButton colorScheme="neutral" onClick={handleResetClick}>
              Reset
            </ResetButton>
            <SubmitButton>
               Encryption
            </SubmitButton>
          </div>
        </Form>

        {result &&(
          <div style={{ marginTop: 16 }}>
          <TextArea
            label="Encrypted Text"
            value={result.cipherText}
            readOnly={true}
            autoResize={true}
          />
          <TextArea
            label="Key"
            value={result.key}
            readOnly={true}
            autoResize={true}
          />
        </div>
        )}
      </Box>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Encrypt };
export default Encrypt;
//@@viewOff:exports