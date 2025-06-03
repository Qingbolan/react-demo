import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { 
  $getRoot, 
  $createParagraphNode, 
  $createTextNode, 
  KEY_BACKSPACE_COMMAND, 
  KEY_DELETE_COMMAND,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  CONTROLLED_TEXT_INSERTION_COMMAND,
  DELETE_CHARACTER_COMMAND,
  DELETE_WORD_COMMAND,
  DELETE_LINE_COMMAND,
  KEY_SPACE_COMMAND
} from 'lexical';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';

// Import TitlePlugin specific styles
import '../../ui/TitlePlugin/TitlePlugin.css';

export default function TitlePlugin({ 
  hasDefaultTitle = false, 
  titlePlaceholder = "Enter your title..." 
}) {
  const [editor] = useLexicalComposerContext();

  // Initialize default title if needed
  useEffect(() => {
    if (hasDefaultTitle) {
      editor.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        // Only add default title if editor is completely empty
        if (children.length === 0) {
          const heading = $createHeadingNode('h1');
          heading.append($createTextNode(''));
          root.append(heading);
          
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        } else {
          // Check if first child is not an H1, if so, add one at the beginning
          const firstChild = children[0];
          if (!$isHeadingNode(firstChild) || firstChild.getTag() !== 'h1') {
            const heading = $createHeadingNode('h1');
            heading.append($createTextNode(''));
            root.splice(0, 0, [heading]);
          }
        }
      });
    }
  }, [editor, hasDefaultTitle]);

  // Enhanced placeholder management with better content detection
  useEffect(() => {
    const updatePlaceholders = () => {
      const editorElement = editor.getRootElement();
      if (editorElement) {
        // Find all H1 elements and manage their placeholder state
        const h1Elements = editorElement.querySelectorAll('h1');
        h1Elements.forEach(h1 => {
          h1.setAttribute('data-placeholder', titlePlaceholder);
          h1.classList.add('title-placeholder');
          
          // Check if H1 has actual text content
          const textContent = h1.textContent || '';
          const hasContent = textContent.trim().length > 0;
          
          // Also check for significant child nodes (not just empty spans)
          const hasSignificantContent = Array.from(h1.childNodes).some(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              return (node.textContent || '').trim().length > 0;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              // Check if element has text content or non-empty attributes that indicate content
              return (element.textContent || '').trim().length > 0 || 
                     element.hasAttribute('data-lexical-text') && element.textContent;
            }
            return false;
          });
          
          // Control placeholder visibility
          if (!hasContent && !hasSignificantContent) {
            h1.classList.add('show-placeholder');
          } else {
            h1.classList.remove('show-placeholder');
          }
          
          // Add custom CSS property for fallback
          h1.style.setProperty('--placeholder-text', `"${titlePlaceholder}"`);
        });
      }
    };

    // Update immediately after editor is ready
    const timeoutId = setTimeout(updatePlaceholders, 100);

    // Listen for editor updates with debouncing
    let updateTimeoutId;
    const removeUpdateListener = editor.registerUpdateListener(() => {
      // Debounce updates to avoid excessive DOM manipulation
      clearTimeout(updateTimeoutId);
      updateTimeoutId = setTimeout(updatePlaceholders, 50);
    });

    // Set up mutation observer for dynamic content changes
    const editorElement = editor.getRootElement();
    let observer;
    
    if (editorElement) {
      observer = new MutationObserver((mutations) => {
        // Only update if relevant changes occurred
        const shouldUpdate = mutations.some(mutation => {
          return mutation.type === 'childList' || 
                 (mutation.type === 'attributes' && mutation.attributeName === 'class') ||
                 (mutation.type === 'characterData');
        });
        
        if (shouldUpdate) {
          clearTimeout(updateTimeoutId);
          updateTimeoutId = setTimeout(updatePlaceholders, 50);
        }
      });

      observer.observe(editorElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-lexical-text'],
        characterData: true
      });
    }

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(updateTimeoutId);
      removeUpdateListener();
      if (observer) {
        observer.disconnect();
      }
    };
  }, [editor, titlePlaceholder]);

  // Enhanced deletion protection - prevent any deletion of the first H1
  useEffect(() => {
    if (!hasDefaultTitle) return;

    // Helper function to ensure first H1 exists
    const ensureFirstH1Exists = () => {
      editor.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        // If no children or first child is not H1, add one
        if (children.length === 0 || !$isHeadingNode(children[0]) || children[0].getTag() !== 'h1') {
          const heading = $createHeadingNode('h1');
          heading.append($createTextNode(''));
          
          if (children.length === 0) {
            root.append(heading);
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          } else {
            root.splice(0, 0, [heading]);
          }
        }
      });
    };

    // Helper function to check if action would affect first H1
    const wouldAffectFirstH1 = () => {
      return editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const root = $getRoot();
        const children = root.getChildren();
        
        if (children.length === 0) return false;
        
        const firstChild = children[0];
        if (!$isHeadingNode(firstChild) || firstChild.getTag() !== 'h1') return false;

        const anchor = selection.anchor;
        const focus = selection.focus;
        
        // Check if selection involves the first H1 in any way
        return anchor.key === firstChild.getKey() || 
               focus.key === firstChild.getKey() ||
               anchor.getNode().getTopLevelElement() === firstChild ||
               focus.getNode().getTopLevelElement() === firstChild;
      });
    };

    // Ultra-strict backspace protection
    const removeBackspaceListener = editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      (event) => {
        const affectsFirstH1 = wouldAffectFirstH1();
        
        if (affectsFirstH1) {
          return editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return true; // Block if no valid selection

            const root = $getRoot();
            const children = root.getChildren();
            
            if (children.length === 0) return true; // Block if no content
            
            const firstChild = children[0];
            if (!$isHeadingNode(firstChild) || firstChild.getTag() !== 'h1') return true;

            const anchor = selection.anchor;
            
            // Always block if cursor is at the very beginning of H1
            if (anchor.key === firstChild.getKey() && anchor.offset === 0) {
              return true;
            }
            
            // Block if this would delete the entire H1 node
            if (selection.isCollapsed()) {
              // For collapsed selection, check if we're at start
              return anchor.key === firstChild.getKey() && anchor.offset === 0;
            } else {
              // For range selection, check if it spans the entire H1 or starts from beginning
              const focus = selection.focus;
              const startsAtBeginning = anchor.key === firstChild.getKey() && anchor.offset === 0;
              const endsAfterH1 = focus.key !== firstChild.getKey() || 
                                 focus.offset >= firstChild.getTextContentSize();
              
              return startsAtBeginning; // Block any deletion starting from H1 beginning
            }
          });
        }
        
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Ultra-strict delete key protection
    const removeDeleteListener = editor.registerCommand(
      KEY_DELETE_COMMAND,
      (event) => {
        const affectsFirstH1 = wouldAffectFirstH1();
        
        if (affectsFirstH1) {
          // Always ensure H1 exists after any delete operation
          setTimeout(ensureFirstH1Exists, 0);
          
          return editor.getEditorState().read(() => {
            const selection = $getSelection();
            if (!$isRangeSelection(selection)) return true;

            const root = $getRoot();
            const children = root.getChildren();
            
            if (children.length === 0) return true;
            
            const firstChild = children[0];
            if (!$isHeadingNode(firstChild) || firstChild.getTag() !== 'h1') return true;

            // Block any selection that would remove the H1 structure
            if (!selection.isCollapsed()) {
              const anchor = selection.anchor;
              const focus = selection.focus;
              
              // If selection spans across or includes the entire H1, block it
              const includesH1 = anchor.key === firstChild.getKey() || focus.key === firstChild.getKey();
              return includesH1;
            }
            
            return false;
          });
        }
        
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Block character deletion that affects H1
    const removeDeleteCharListener = editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      (isBackward) => {
        if (wouldAffectFirstH1()) {
          if (isBackward) {
            // Same logic as backspace
            return editor.getEditorState().read(() => {
              const selection = $getSelection();
              if (!$isRangeSelection(selection)) return true;
              
              const root = $getRoot();
              const children = root.getChildren();
              if (children.length === 0) return true;
              
              const firstChild = children[0];
              if (!$isHeadingNode(firstChild) || firstChild.getTag() !== 'h1') return true;
              
              const anchor = selection.anchor;
              return anchor.key === firstChild.getKey() && anchor.offset === 0;
            });
          } else {
            // Forward delete - ensure H1 remains
            setTimeout(ensureFirstH1Exists, 0);
            return false;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Block word deletion that affects H1
    const removeDeleteWordListener = editor.registerCommand(
      DELETE_WORD_COMMAND,
      (isBackward) => {
        if (wouldAffectFirstH1()) {
          // Always block word deletion if it affects H1
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Block line deletion that affects H1
    const removeDeleteLineListener = editor.registerCommand(
      DELETE_LINE_COMMAND,
      (isBackward) => {
        if (wouldAffectFirstH1()) {
          // Always block line deletion if it affects H1
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Monitor paste operations
    const removePasteListener = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (wouldAffectFirstH1()) {
          // Allow paste but ensure H1 structure is maintained
          setTimeout(ensureFirstH1Exists, 0);
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Monitor text insertion
    const removeInsertTextListener = editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      (text) => {
        // Allow text insertion but ensure H1 structure is maintained
        if (wouldAffectFirstH1()) {
          setTimeout(ensureFirstH1Exists, 0);
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Regular check to ensure H1 exists (safety net)
    const intervalId = setInterval(() => {
      ensureFirstH1Exists();
    }, 500);

    // Immediate check on any editor state change
    const removeUpdateListener = editor.registerUpdateListener(() => {
      // Check after any update
      setTimeout(ensureFirstH1Exists, 0);
    });

    return () => {
      removeBackspaceListener();
      removeDeleteListener();
      removeDeleteCharListener();
      removeDeleteWordListener();
      removeDeleteLineListener();
      removePasteListener();
      removeInsertTextListener();
      removeUpdateListener();
      clearInterval(intervalId);
    };
  }, [editor, hasDefaultTitle]);

  // Prevent headings from starting with spaces
  useEffect(() => {
    // Helper function to check if we're at the beginning of a heading
    const isAtHeadingStart = () => {
      return editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return false;

        const anchorNode = selection.anchor.getNode();
        const parentElement = anchorNode.getTopLevelElement();
        
        // Check if we're in a heading node (H1-H6)
        if (!$isHeadingNode(parentElement)) return false;

        // Check if cursor is at the very beginning
        const anchor = selection.anchor;
        if (anchor.offset === 0) {
          // Also check if the heading has no text content or only whitespace
          const headingText = parentElement.getTextContent();
          return headingText.length === 0 || headingText.match(/^\s*$/);
        }

        return false;
      });
    };

    // Intercept space key press
    const removeSpaceListener = editor.registerCommand(
      KEY_SPACE_COMMAND,
      (event) => {
        if (isAtHeadingStart()) {
          // Prevent space at the beginning of headings
          event.preventDefault();
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Intercept text insertion
    const removeTextInsertionListener = editor.registerCommand(
      CONTROLLED_TEXT_INSERTION_COMMAND,
      (text) => {
        // Check if the inserted text starts with space and we're at heading start
        if (text && text.startsWith(' ') && isAtHeadingStart()) {
          // Remove leading spaces from the text
          const trimmedText = text.replace(/^\s+/, '');
          
          // If there's still text after trimming, insert it
          if (trimmedText.length > 0) {
            editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                selection.insertText(trimmedText);
              }
            });
          }
          
          // Block the original insertion
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    // Intercept paste operations to remove leading spaces
    const removePasteListener = editor.registerCommand(
      PASTE_COMMAND,
      (event) => {
        if (isAtHeadingStart()) {
          // Get clipboard data
          const clipboardData = event.clipboardData;
          if (clipboardData) {
            const pastedText = clipboardData.getData('text/plain');
            if (pastedText && pastedText.match(/^\s+/)) {
              // Prevent default paste and insert trimmed text
              event.preventDefault();
              
              const trimmedText = pastedText.replace(/^\s+/, '');
              if (trimmedText.length > 0) {
                editor.update(() => {
                  const selection = $getSelection();
                  if ($isRangeSelection(selection)) {
                    selection.insertText(trimmedText);
                  }
                });
              }
              
              return true;
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );

    return () => {
      removeSpaceListener();
      removeTextInsertionListener();
      removePasteListener();
    };
  }, [editor]);

  return null;
} 