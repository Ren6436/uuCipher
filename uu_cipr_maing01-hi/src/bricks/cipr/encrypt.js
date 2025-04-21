//@@viewOn:imports
import { createVisualComponent, Utils, useState } from "uu5g05";
import Config from "./config/config.js";
import UU5 from "uu5g04";
import "uu5g04-bricks";
import { Box } from "uu5g05-elements";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: (props) => Config.Css.css({}),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

const Encryp = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Tabs",
  //@@viewOff:statics

  //@@viewOn:propTypes
  propTypes: {},
  //@@viewOff:propTypes

  //@@viewOn:defaultProps
  defaultProps: {},
  //@@viewOff:defaultProps

  render(props) {
    //@@viewOn:private
    const { children } = props;
    //@@viewOff:private

    //@@viewOn:render
    const attrs = Utils.VisualComponent.getAttrs(props, Css.main(props));

    return (
      <Box style={{ width: 640, margin: "24px auto" }}>
</Box>
    );
    //@@viewOff:render
  },
});

//@@viewOn:exports
export { Encryp };
export default Encryp;
//@@viewOff:exports
