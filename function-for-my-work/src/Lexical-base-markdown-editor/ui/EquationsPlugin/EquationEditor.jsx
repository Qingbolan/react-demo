/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './EquationEditor.css';
import {isHTMLElement} from 'lexical';
import {forwardRef} from 'react';

/**
 * @typedef {Object} BaseEquationEditorProps
 * @property {string} equation - The equation string
 * @property {boolean} inline - Whether the equation is inline
 * @property {function} setEquation - Function to update the equation
 */

/**
 * Equation editor component that renders either an inline input or block textarea
 * @param {BaseEquationEditorProps} props - Component props
 * @param {React.Ref} forwardedRef - Forwarded ref for the input/textarea
 * @returns {JSX.Element}
 */
function EquationEditor(props, forwardedRef) {
  const {equation, setEquation, inline} = props;

  const onChange = (event) => {
    setEquation(event.target.value);
  };

  return inline ? (
    <span className="EquationEditor_inputBackground">
      <span className="EquationEditor_dollarSign">$</span>
      <input
        className="EquationEditor_inlineEditor"
        value={equation}
        onChange={onChange}
        autoFocus={true}
        ref={forwardedRef}
      />
      <span className="EquationEditor_dollarSign">$</span>
    </span>
  ) : (
    <div className="EquationEditor_inputBackground">
      <span className="EquationEditor_dollarSign">$$</span>
      <textarea
        className="EquationEditor_blockEditor"
        value={equation}
        onChange={onChange}
        ref={forwardedRef}
      />
      <span className="EquationEditor_dollarSign">$$</span>
    </div>
  );
}

export default forwardRef(EquationEditor);
