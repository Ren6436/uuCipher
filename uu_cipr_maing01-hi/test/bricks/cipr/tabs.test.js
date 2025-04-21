import { Test, VisualComponent } from "uu5g05-test";
import Tabs from "../../../src/bricks/cipr/tabs.js";

function getDefaultProps() {
  return {
    children: "Test content",
  };
}

async function setup(props = {}, opts) {
  return VisualComponent.setup(Tabs, { ...getDefaultProps(), ...props }, opts);
}

describe("UuCipr.Bricks.Cipr.Tabs", () => {
  VisualComponent.testProperties(setup);

  it("checks default property values", async () => {
    await setup();

    expect(Test.screen.getByText("Test content")).toBeInTheDocument();
  });
});
