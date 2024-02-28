import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkImages from "remark-images";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import slug from 'rehype-slug';
import remarkHeadingId from 'remark-heading-id';

export const renderToHtml = async (sourceCode: string): Promise<string> => {
  var file = await unified()
    .use(remarkParse) // 解析 Markdown
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkImages)
    .use(remarkHeadingId)
    .use(remarkRehype, { allowDangerousHtml: true }) // 将 Markdown AST 转换为 HTML AST
    .use(rehypeRaw)
    .use(slug) // 为所有标题元素添加 ID
    .use(rehypeStringify) // 将 HTML AST 转换为字符串形式的 HTML
    .use(rehypeHighlight)
    .process(sourceCode);
  return String(file);
};

export const renderMarkdownFregment = (sourceCode: string): string => {
  const file = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify)
  .processSync(sourceCode)
  return String(file);
};
