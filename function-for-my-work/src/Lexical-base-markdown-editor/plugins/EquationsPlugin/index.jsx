/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import 'katex/dist/katex.css';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, createCommand, TextNode } from 'lexical';
import { useCallback, useEffect } from 'react';

import { $createEquationNode, EquationNode } from '../../nodes/EquationsPlugin/EquationNode';
import KatexEquationAlterer from '../../ui/EquationsPlugin/KatexEquationAlterer';

export const INSERT_EQUATION_COMMAND = createCommand('INSERT_EQUATION_COMMAND');

export function InsertEquationDialog({ activeEditor, onClose }) {
    const onEquationConfirm = useCallback(
        (equation, inline) => {
            activeEditor.dispatchCommand(INSERT_EQUATION_COMMAND, { equation, inline });
            onClose();
        },
        [activeEditor, onClose],
    );

    return <KatexEquationAlterer onConfirm={onEquationConfirm} />;
}

export default function EquationsPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EquationNode])) {
      throw new Error('EquationsPlugin: EquationNode not registered on editor');
    }

    const blockEquationRegex = /\$\$(.*?)\$\$/s;
    const blockTransformer = editor.registerNodeTransform(TextNode, (node) => {
      const text = node.getTextContent();
      const match = text.match(blockEquationRegex);
      if (match) {
        const [, equation] = match;
        const equationNode = $createEquationNode(equation, false);
        node.replace(equationNode);
      }
    });

    const inlineEquationRegex = /\$([^$\n]+?)\$/;
    const inlineTransformer = editor.registerNodeTransform(TextNode, (node) => {
      const text = node.getTextContent();
      const match = text.match(inlineEquationRegex);
      if (match) {
        const [, equation] = match;
        const equationNode = $createEquationNode(equation, true);
        node.replace(equationNode);
      }
    });

    const commandListener = editor.registerCommand(
      INSERT_EQUATION_COMMAND,
      (payload) => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const { equation, inline } = payload;
          const equationNode = $createEquationNode(equation, inline);
          selection.insertNodes([equationNode]);
          return true;
        }
        return false;
      },
      0,
    );

    return () => {
      blockTransformer();
      inlineTransformer();
      commandListener();
    };
  }, [editor]);

  return null;
} 