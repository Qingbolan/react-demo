/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './KatexEquationAlterer.css';
import { useCallback, useState } from 'react';
import katex from 'katex';

/**
 * Renders an equation editor dialog with live preview
 */
export default function KatexEquationAlterer({
  onConfirm,
  initialEquation = '',
  initialInline = false,
}) {
  const [equation, setEquation] = useState(initialEquation);
  const [inline, setInline] = useState(initialInline);
  const [katexError, setKatexError] = useState(null);

  const onClick = useCallback(() => {
    onConfirm(equation, inline);
  }, [onConfirm, equation, inline]);

  const onEquationChange = useCallback((event) => {
    setEquation(event.target.value);

    try {
      katex.renderToString(event.target.value, {
        displayMode: !inline,
        errorColor: '#cc0000',
        output: 'html',
        strict: 'warn',
        throwOnError: true,
        trust: false,
      });
      setKatexError(null);
    } catch (error) {
      setKatexError(error.message);
    }
  }, [inline]);

  const onInlineChange = useCallback((event) => {
    setInline(event.target.checked);
  }, []);

  return (
    <div className="KatexEquationAlterer_container">
      <div className="KatexEquationAlterer_inputFields">
        <textarea
          className="KatexEquationAlterer_textArea"
          onChange={onEquationChange}
          value={equation}
          placeholder="请输入LaTeX公式"
        />
        <div className="KatexEquationAlterer_optionFields">
          <label className="KatexEquationAlterer_inlineCheckbox">
            <input
              type="checkbox"
              checked={inline}
              onChange={onInlineChange}
            />
            内联模式
          </label>
          <button
            className="KatexEquationAlterer_confirmButton"
            onClick={onClick}
            disabled={!!katexError}>
            确认
          </button>
        </div>
        {katexError && (
          <div className="KatexEquationAlterer_errorMessage">
            {katexError}
          </div>
        )}
      </div>
      <div
        className={`KatexEquationAlterer_preview ${
          inline ? 'KatexEquationAlterer_inlinePreview' : ''
        }`}>
        <p className="KatexEquationAlterer_previewText">预览</p>
        <div
          className="KatexEquationAlterer_katexOutput"
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(equation || 'E = mc^2', {
              displayMode: !inline,
              errorColor: '#cc0000',
              output: 'html',
              strict: 'warn',
              throwOnError: false,
              trust: false,
            }),
          }}
        />
      </div>
    </div>
  );
}
