//@@viewOn:imports
import { createVisualComponent, PropTypes, Utils } from "uu5g05";
import { Box } from "uu5g05-elements";
import { Form, FormText, SubmitButton, CancelButton, FormFile } from "uu5g05-forms";
import Config from "../config/config";

//@@viewOff:imports

const Encrypt = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "CreateForm",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
  },
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {
    onSubmit: () => {},
    onCancel: () => {},
  },
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:render
    const { elementProps } = Utils.VisualComponent.splitProps(props);

    return (
      <Box style={{ width: 640, padding: 20 }}>
      <Form {...elementProps} onSubmit={props.onSubmit}>
        <FormText name="text" label="Enter text" />
        <FormFile name="file" label="File" />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 8 }}>
          <CancelButton onClick={props.onCancel}>Cancel</CancelButton>
          <SubmitButton>Break Encryption</SubmitButton>
        </div>
      </Form>
      </Box>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Encrypt };
export default Encrypt;
//@@viewOff:exports