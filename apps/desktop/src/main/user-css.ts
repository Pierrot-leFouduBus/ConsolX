// The user CSS file, user.css next to settings.json: styles applied on top of the theme.
// New files get this text: nothing is applied, every example is in a comment.
export const NEW_USER_CSS_FILE = `/* ConsolX user styles. What you write here applies on top of the theme, as soon as you
   save the file. Change the look of ConsolX by giving the theme variables other values:
   https://github.com/Pierrot-leFouduBus/ConsolX/blob/main/docs/user/themes.md

   To use an example below, remove the comment marks around it. */

/* Other colors for the tab bars and the terminals, in every theme:
:root {
  --cx-surface: #3a2f5a;
  --cx-terminal-bg: #202040;
  --cx-terminal-cursor: #e6c07b;
}
*/

/* Other terminal colors, in the light theme only:
:root[data-theme='light'] {
  --cx-terminal-bg: #ffffff;
  --cx-terminal-fg: #000000;
}
*/

/* Bigger tabs:
:root {
  --cx-tab-bar-height: 36px;
  --cx-font-size-small: 13px;
}
*/
`
