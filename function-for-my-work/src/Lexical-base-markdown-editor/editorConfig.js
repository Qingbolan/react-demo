import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { EquationNode } from './nodes/EquationsPlugin/EquationNode';
import theme from './theme';

// Error handler for Lexical editor
function onError(error) {
  console.error(error);
}

// Initial editor configuration
const initialConfig = {
  namespace: 'MyEditor',
  theme,
  onError,
  nodes: [
    HeadingNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    TableNode,
    TableCellNode,
    TableRowNode,
    AutoLinkNode,
    LinkNode,
    EquationNode
  ],
};

export default initialConfig; 