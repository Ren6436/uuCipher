//@@viewOn:imports
import { createVisualComponent } from "uu5g05";
import { Box, useAlertBus } from "uu5g05-elements";
import { Form, FormText, SubmitButton, FormFile } from "uu5g05-forms";
import Config from "../config/config";
import Calls from "../../../calls";
//@@viewOff:imports

const Break = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Break",
  //@@viewOff:statics

  render() {
    const { addAlert } = useAlertBus();

    async function handleSubmit(values) {
      try {
        const result = await Calls.breakCreate(values);
        addAlert({
          message: "Decryption successful!",
          priority: "success",
          durationMs: 2000,
        });
        return result;
      } catch (error) {
        addAlert({
          message: "Decryption failed: " + error.message,
          priority: "error",
          durationMs: 3000,
        });
        throw error;
      }
    }

    return (
      <Box style={{ width: 640, padding: 20 }}>
        <Form onSubmit={handleSubmit}>
          <FormText 
            name="value" 
            label="Encrypted text" 
            required 
            placeholder="Paste your encrypted text here"
          />
          <FormFile 
            name="file" 
            label="Or upload encrypted file" 
            accept=".txt,.enc"
          />
          <div style={{ 
            display: "flex", 
            justifyContent: "flex-end", 
            paddingTop: 16,
            gap: 8
          }}>
            <SubmitButton>
              Break Encryption
            </SubmitButton>
          </div>
        </Form>
      </Box>
    );
  },
});

//@@viewOn:exports
export { Break };
export default Break;
//@@viewOff:exports