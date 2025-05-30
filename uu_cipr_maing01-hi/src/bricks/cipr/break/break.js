//@@viewOn:imports
import { createVisualComponent, useState } from "uu5g05";
import { Box, useAlertBus } from "uu5g05-elements";
import { Form, SubmitButton, FormFile, FormTextArea, TextArea, ResetButton } from "uu5g05-forms";
import Config from "../config/config";
import Calls from "../../../calls";
//@@viewOff:imports

const Break = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Break",
  //@@viewOff:statics

  render() {
    const { addAlert } = useAlertBus();
    const [result, setResult] = useState(null);

    async function handleSubmit(values) {
      try {
        const res = await Calls.breakCreate(values);
        const text = res.data?.result ?? "";

        setResult(text);

        addAlert({
          message: "Decryption successful!",
          priority: "success",
          durationMs: 2000,
        });

        return res;
      } catch (error) {
        setResult(null);
        addAlert({
          message: "Decryption failed: " + error.message,
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
            label="Encrypted text"
            placeholder="Paste your encrypted text here"
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
            Break Encryption
            </SubmitButton>
          </div>
        </Form>

        {result && (
          <TextArea
            label="Decryption Result"
            value={result}
            readOnly={true}
            autoResize={true}
          />
        )}
      </Box>
    );
  },
});

//@@viewOn:exports
export { Break };
export default Break;
//@@viewOff:exports
