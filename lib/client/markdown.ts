import { marked } from "marked";
import hljs from "highlight.js";

function getCodeTheme(theme: string) {
  switch (theme) {
    case "blue":
      return "colorBrewer";
    case "dark":
    case "embers":
      return "github";
    case "lavendar":
      return "dracula";
    case "cactus":
      return "atomOneDark";
    case "cabana":
    case "moss":
      return "monokaiSublime";
    default:
      return theme;
  }
}

function markdown(text: string, theme: string) {
  const codeTheme = getCodeTheme(theme);
  marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function (code, lang) {
      hljs.configure(theme ? { classPrefix: `${codeTheme}-` } : null);
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
    langPrefix: `hljs ${codeTheme} language-`,
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    xhtml: false,
  });
  return marked.parse(text);
}

export default markdown;
