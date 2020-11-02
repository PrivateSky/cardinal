import { Build } from "@stencil/core";
import CustomTheme_v1 from "./custom-theme/CustomTheme.old";
import CustomTheme_v2 from "./custom-theme/CustomTheme.new";

const GLOBALS = {
  VERSIONS: [
    { ref: CustomTheme_v1, version: 'v1.0' },
    { ref: CustomTheme_v2, version: 'v2.0' }
  ]
}

const version = (window as any).customThemeVersion;
const isValid = [1, 2].includes(version);
const theme = isValid ? GLOBALS.VERSIONS[version - 1] : GLOBALS.VERSIONS[0];

if (Build.isDev) {
  const STENCIL_DEV_STYLE = [
    '%c%s',
    'color: white; background: #4461b4; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 5px'
  ]
  if (version) console.log(...STENCIL_DEV_STYLE, 'CustomTheme', theme.version);
}

export default theme.ref;
