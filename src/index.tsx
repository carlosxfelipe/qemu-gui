import { render } from "@gtkx/react";
import pkg from "../package.json" with { type: "json" };
import { App } from "./app.js";
import "./index.css";

render(<App />, pkg.gtkx.appId);
