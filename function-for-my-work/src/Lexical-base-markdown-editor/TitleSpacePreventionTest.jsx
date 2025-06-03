import React from 'react';
import LexicalWysiwygEditor from './LexicalEditor';

/**
 * Test component for verifying heading space prevention functionality
 * Tests that all heading levels (H1-H6) cannot start with spaces
 */
export default function TitleSpacePreventionTest() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Heading Space Prevention Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Instructions:</h2>
        <ul>
          <li>Try typing spaces at the beginning of any heading (H1-H6)</li>
          <li>Try pasting text with leading spaces into headings</li>
          <li>The editor should automatically prevent or remove leading spaces</li>
          <li>Use markdown syntax like # ## ### #### ##### ###### to create headings</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Editor (with default title):</h3>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}>
          <LexicalWysiwygEditor 
            hasDefaultTitle={true}
            titlePlaceholder="Try adding spaces before this title..."
          />
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Editor (without default title):</h3>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}>
          <LexicalWysiwygEditor 
            hasDefaultTitle={false}
            titlePlaceholder="Regular placeholder"
          />
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Expected Behavior:</h3>
        <ul>
          <li>✅ Pressing space at the beginning of any heading should be ignored</li>
          <li>✅ Pasting text with leading spaces should automatically trim the spaces</li>
          <li>✅ Typing regular text after the prevented spaces should work normally</li>
          <li>✅ Spaces in the middle or end of headings should work normally</li>
          <li>✅ The feature should work for all heading levels (H1, H2, H3, H4, H5, H6)</li>
        </ul>
      </div>
    </div>
  );
} 