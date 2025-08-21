// src/components/PromptCard.jsx

import React from "react";
import PropTypes from "prop-types";

/**
 * Hinge-style Prompt Card for MyanMatch
 * @param {string} title - The prompt section (e.g., "The Warm-Up")
 * @param {string} text - The prompt/question content
 */
const PromptCard = ({ title, text }) => (
  <div className="prompt-hinge bg-theme-surface-pure rounded-xl shadow-lg p-5 my-3 text-theme-primary max-w-xs mx-auto">
    <div className="text-xs text-theme-secondary mb-2">{title}</div>
    <div className="text-xl font-semibold">{text}</div>
  </div>
);

PromptCard.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

export default PromptCard;
