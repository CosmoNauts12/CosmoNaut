"use client";

import React from "react";

/**
 * JsonHighlighter Component
 * 
 * Simple utility to highlight JSON strings with custom colors.
 * - Keys: Sky Blue (#38BDF8)
 * - Strings: Amber/Orange (#F59E0B)
 * - Numbers/Booleans: Teal (#2DD4BF)
 * - Null: Rose (#FB7185)
 */
export default function JsonHighlighter({ json }: { json: string }) {
    if (!json) return null;

    const highlight = (text: string) => {
        // Escape HTML special characters
        text = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        return text.replace(
            /(".*?"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
                let cls = "json-bool"; // default (numbers)
                if (match.startsWith('"')) {
                    // A match ending with a colon is a key
                    const isKey = /:\s*$/.test(match);
                    if (isKey) {
                        cls = "json-key";
                    } else {
                        // Check if value is a URL, standalone protocol, or domain
                        const content = match.slice(1, -1);
                        const isApiRelated =
                            /^(https?|wss?|ftp|file)(:\/\/)?$/i.test(content) ||
                            /^https?:\/\//i.test(content) ||
                            /^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(content) ||
                            (content.includes('.') && content.length > 3 && !content.includes(' '));

                        if (isApiRelated) {
                            cls = "json-url"; // Style as URL/Protocol
                        } else {
                            cls = "json-val";
                        }
                    }
                } else if (/true|false/.test(match)) {
                    cls = "json-bool";
                } else if (/null/.test(match)) {
                    cls = "json-null";
                }
                return `<span class="${cls}">${match}</span>`;
            }
        );
    };

    return (
        <pre
            className="whitespace-pre overflow-visible leading-relaxed"
            dangerouslySetInnerHTML={{ __html: highlight(json) }}
        />
    );
}
