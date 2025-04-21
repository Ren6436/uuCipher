//@@viewOn:imports
import { Utils, createVisualComponent, useSession, Lsi } from "uu5g05";
import { withRoute } from "uu_plus4u5g02-app";
import Tabs from "../bricks/cipr/tabs.js";
import Config from "./config/config.js";

//@@viewOff:imports

//@@viewOn:constants
//@@viewOff:constants

//@@viewOn:css
const Css = {
  icon: () =>
    Config.Css.css({
      fontSize: 48,
      lineHeight: "1em",
    }),
};
//@@viewOff:css

//@@viewOn:helpers
//@@viewOff:helpers

export const Home = () => {
  const handleSubmit = (data) => {
    console.log("Form submitted:", data);
  };

  return (
    <section>
      <Tabs onSubmit={handleSubmit} />
    </section>
  );
};
