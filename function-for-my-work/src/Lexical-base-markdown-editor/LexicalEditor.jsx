import { useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { TRANSFORMERS } from '@lexical/markdown';

// Import plugins
import EquationsPlugin from './plugins/EquationsPlugin';
import TitlePlugin from './plugins/TitlePlugin/TitlePlugin';
import 'katex/dist/katex.css';

// Import custom components and configs
import initialConfig from './editorConfig';

// Import styles
import './editor.css';

export default function LexicalWysiwygEditor({ 
  hasDefaultTitle = true, 
  titlePlaceholder = "Enter your title..." 
}) {
    const editorRef = useRef(null);

    return (
        <div>
            <LexicalComposer initialConfig={initialConfig}>
                <div className="editor-inner">
                    <TitlePlugin 
                        hasDefaultTitle={hasDefaultTitle} 
                        titlePlaceholder={titlePlaceholder}
                    />
                    <RichTextPlugin
                        contentEditable={
                            <ContentEditable
                                className="editor-input markdown-cell"
                                ref={editorRef}
                            />
                        }
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <HistoryPlugin />
                    <AutoFocusPlugin />
                    <ListPlugin />
                    <LinkPlugin />
                    <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
                    <TabIndentationPlugin />
                    <EquationsPlugin />
                </div>
            </LexicalComposer>
        </div>
    );
}