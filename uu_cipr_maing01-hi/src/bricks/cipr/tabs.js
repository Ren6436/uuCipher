//@@viewOn:imports
//import { useState } from "uu5g05";
import UU5 from "uu5g04";
import "uu5g04-bricks";
import { createVisualComponent } from "uu5g05";
import { Box } from "uu5g05-elements";
import Config from "./config/config.js";
import { withRoute } from "uu_plus4u5g02-app";
import Encrypt from "./encrypt/encrypt.js";
import Decrypt from "./decrypt/decrypt.js";
import Break from "./break/break.js";

//@@viewOff:imports

let Tab = createVisualComponent({
  //@@viewOn:statics
  uu5Tag: Config.TAG + "Tab",
  //@@viewOff:statics

  render() {
    //@@viewOn:render
    return (
      <Box style={{ width: 640, margin: "24px auto" }}>
        <UU5.Bricks.Tabs fade>
          <UU5.Bricks.Tabs.Item header="Encryption">
            <Encrypt />
          </UU5.Bricks.Tabs.Item>
          <UU5.Bricks.Tabs.Item header="Decryption">
            <Decrypt />
          </UU5.Bricks.Tabs.Item>
          <UU5.Bricks.Tabs.Item header="Break Encryption">
            <Break />
          </UU5.Bricks.Tabs.Item>
        </UU5.Bricks.Tabs>
      </Box>
    );
    //@@viewOff:render
  },
});

Tab = withRoute(Tab, { authenticated: true });

//@@viewOn:exports
export { Tab };
export default Tab;
//@@viewOff:exports
