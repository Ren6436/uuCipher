//@@viewOn:imports
import { useState } from "uu5g05";
import UU5 from "uu5g04";
import "uu5g04-bricks";
import { Box } from "uu5g05-elements";
import Config from "./config/config.js";
import Encryp from "./encrypt.js";
import Decrypt from "./decrypt.js";
import Break from "./break.js";
//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  main: () => Config.Css.css({}),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

export default function Tabs({ onSubmit = () => {} }) {
  //@@viewOn:render
  return (
    <Box style={{ width: 640, margin: "24px auto" }}>
      <UU5.Bricks.Tabs fade>
        <UU5.Bricks.Tabs.Item header="Encryption">
          <Encryp onSubmit={onSubmit} />
        </UU5.Bricks.Tabs.Item>
        <UU5.Bricks.Tabs.Item header="Decryption">
          <Decrypt onSubmit={onSubmit} />
        </UU5.Bricks.Tabs.Item>
        <UU5.Bricks.Tabs.Item header="Break Encrypted Text">
          <Break onSubmit={onSubmit} />
        </UU5.Bricks.Tabs.Item>
      </UU5.Bricks.Tabs>
    </Box>
  );
  //@@viewOff:render
}
