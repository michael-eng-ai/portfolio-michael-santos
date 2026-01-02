import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const renderContent = (text: string) => {
    const elements: React.ReactNode[] = [];
    const lines = text.split("\n");
    let currentList: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Handle empty lines
      if (!line.trim()) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-2">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-foreground">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }
        i++;
        continue;
      }

      // Handle headings (##)
      if (line.startsWith("## ")) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-2">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-foreground">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }
        elements.push(
          <h2 key={`h2-${elements.length}`} className="font-heading text-2xl font-bold text-foreground mt-8 mb-4">
            {renderInlineMarkdown(line.replace("## ", ""))}
          </h2>
        );
        i++;
        continue;
      }

      // Handle headings (###)
      if (line.startsWith("### ")) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-2">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-foreground">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }
        elements.push(
          <h3 key={`h3-${elements.length}`} className="font-heading text-xl font-semibold text-foreground mt-6 mb-3">
            {renderInlineMarkdown(line.replace("### ", ""))}
          </h3>
        );
        i++;
        continue;
      }

      // Handle list items (- or *)
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        currentList.push(line.trim().replace(/^[-*]\s/, ""));
        i++;
        continue;
      }

      // Handle numbered list items
      if (/^\d+\.\s/.test(line.trim())) {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-2">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-foreground">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside mb-4 space-y-2">
            {(() => {
              const numberedItems = [];
              let j = i;
              while (j < lines.length && /^\d+\.\s/.test(lines[j].trim())) {
                numberedItems.push(
                  <li key={j} className="text-foreground">
                    {renderInlineMarkdown(lines[j].trim().replace(/^\d+\.\s/, ""))}
                  </li>
                );
                j++;
              }
              i = j - 1;
              return numberedItems;
            })()}
          </ol>
        );
        i++;
        continue;
      }

      // Handle horizontal rules
      if (line.trim() === "---" || line.trim() === "***") {
        if (currentList.length > 0) {
          elements.push(
            <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-2">
              {currentList.map((item, idx) => (
                <li key={idx} className="text-foreground">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
          currentList = [];
        }
        elements.push(<hr key={`hr-${elements.length}`} className="my-6 border-border" />);
        i++;
        continue;
      }

      // Handle regular paragraphs
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-2">
            {currentList.map((item, idx) => (
              <li key={idx} className="text-foreground">
                {renderInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }

      elements.push(
        <p key={`p-${elements.length}`} className="text-foreground leading-relaxed mb-4">
          {renderInlineMarkdown(line)}
        </p>
      );
      i++;
    }

    // Handle remaining list items
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-2">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-foreground">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
    }

    return elements;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Handle bold (**text**)
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;

    const processedText = text;
    const segments: Array<{ type: "text" | "bold" | "italic"; content: string }> = [];

    let currentIndex = 0;
    while (currentIndex < processedText.length) {
      // Check for bold
      if (processedText.substr(currentIndex, 2) === "**") {
        const endIndex = processedText.indexOf("**", currentIndex + 2);
        if (endIndex !== -1) {
          segments.push({
            type: "bold",
            content: processedText.substring(currentIndex + 2, endIndex),
          });
          currentIndex = endIndex + 2;
          continue;
        }
      }

      // Check for italic
      if (processedText[currentIndex] === "*" && processedText[currentIndex - 1] !== "*") {
        const endIndex = processedText.indexOf("*", currentIndex + 1);
        if (endIndex !== -1 && processedText[endIndex + 1] !== "*") {
          segments.push({
            type: "italic",
            content: processedText.substring(currentIndex + 1, endIndex),
          });
          currentIndex = endIndex + 1;
          continue;
        }
      }

      // Regular text
      let nextSpecialIndex = processedText.length;
      const nextBold = processedText.indexOf("**", currentIndex);
      const nextItalic = processedText.indexOf("*", currentIndex);

      if (nextBold !== -1) nextSpecialIndex = Math.min(nextSpecialIndex, nextBold);
      if (nextItalic !== -1 && nextItalic !== nextBold) nextSpecialIndex = Math.min(nextSpecialIndex, nextItalic);

      if (nextSpecialIndex > currentIndex) {
        segments.push({
          type: "text",
          content: processedText.substring(currentIndex, nextSpecialIndex),
        });
        currentIndex = nextSpecialIndex;
      } else {
        currentIndex++;
      }
    }

    return segments.map((segment, idx) => {
      if (segment.type === "bold") {
        return (
          <strong key={idx} className="font-semibold text-foreground">
            {segment.content}
          </strong>
        );
      }
      if (segment.type === "italic") {
        return (
          <em key={idx} className="italic text-foreground">
            {segment.content}
          </em>
        );
      }
      return <span key={idx}>{segment.content}</span>;
    });
  };

  return <div className="prose prose-invert max-w-none">{renderContent(content)}</div>;
}
