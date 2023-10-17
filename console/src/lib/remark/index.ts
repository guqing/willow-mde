import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import remarkBreaks from 'remark-breaks';
import remarkImages from 'remark-images';
import rehypeHighlight from "rehype-highlight";
import remarkGfm from 'remark-gfm';

const toHtml = async (sourceCode: string): Promise<string> => {
  var file = await await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkBreaks)
    .use(remarkImages)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeStringify)
    .use(rehypeHighlight)
    .process(sourceCode);
  return String(file);
};

export default toHtml;
