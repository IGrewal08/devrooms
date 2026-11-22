import React, { useEffect, useId, useState } from "react";

/**
 * MermaidDiagramCard
 * Renders a Mermaid.js diagram returned by the AI Agent service inside a chat card.
 * Attempts to render SVG using the `mermaid` package if installed, and falls back
 * gracefully to a visual code block so the UI never crashes during development.
 *
 * Props:
 * - title: Diagram heading (e.g., "Room workflow")
 * - subtitle: Renderer label (default: "Mermaid diagram · Mermaid.js")
 * - chart: Mermaid DSL string (e.g., "graph LR; A[Room messages] --> B[DevAgent]")
 * - footerNote: Caption shown below the diagram
 */
export default function MermaidDiagramCard({
    title = "Room workflow",
    subtitle = "Mermaid diagram · Mermaid.js",
    chart = "",
    footerNote = "One room conversation, two ways to make it clear.",
}) {
    const uniqueId = useId().replace(/:/g, "");
    const [svgMarkup, setSvgMarkup] = useState("");
    const [renderError, setRenderError] = useState(false);

    // Dynamically load and render Mermaid SVG whenever the diagram DSL updates
    useEffect(() => {
        let isMounted = true;

        async function renderDiagram() {
            if (!chart) return;
            try {
                const mermaidModule = await import("mermaid");
                const mermaid = mermaidModule.default || mermaidModule;

                mermaid.initialize({
                    startOnLoad: false,
                    theme: "dark",
                    securityLevel: "loose",
                });

                const { svg } = await mermaid.render(`dr-mermaid-${uniqueId}`, chart);
                if (isMounted) {
                    setSvgMarkup(svg);
                    setRenderError(false);
                }
            } catch {
                // Fallback triggered if mermaid is not installed yet or syntax is invalid
                if (isMounted) {
                    setSvgMarkup("");
                    setRenderError(true);
                }
            }
        }

        renderDiagram();
        return () => {
            isMounted = false;
        };
    }, [chart, uniqueId]);

    return (
        <div className="dr-card dr-mermaid-card">
            <div className="dr-card-title">{title}</div>
            <div className="dr-card-subtitle">{subtitle}</div>

            {/* Rendered Mermaid SVG canvas or safe fallback preview */}
            <div className="dr-mermaid-canvas">
                {svgMarkup ? (
                    <div dangerouslySetInnerHTML={{ __html: svgMarkup }} />
                ) : (
                    <pre className="dr-mermaid-fallback">
                        {renderError ? chart : "Rendering Mermaid diagram..."}
                    </pre>
                )}
            </div>

            {footerNote && <div className="dr-card-footer">{footerNote}</div>}
        </div>
    );
}