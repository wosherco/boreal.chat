import { describe, it, expect } from "vitest";
import {
  truncateText,
  capitalize,
  camelCaseToWords,
  snakeCaseToWords,
  kebabCaseToWords,
  pluralize,
  formatCount,
  getInitials,
  stripHtml,
  escapeHtml,
} from "../../../src/lib/utils/text";

describe("truncateText", () => {
  it("should return the original text if it's shorter than maxLength", () => {
    const text = "Short text";
    const result = truncateText(text, 20);

    expect(result).toBe("Short text");
  });

  it("should truncate text and add ellipsis if it's longer than maxLength", () => {
    const text = "This is a very long text that needs to be truncated";
    const result = truncateText(text, 20);

    expect(result).toBe("This is a very long ...");
  });

  it("should use default maxLength of 100", () => {
    const text = "a".repeat(150);
    const result = truncateText(text);

    expect(result).toBe("a".repeat(100) + "...");
  });

  it("should use custom ellipsis", () => {
    const text = "This is a long text";
    const result = truncateText(text, 10, "…");

    expect(result).toBe("This is a …");
  });

  it("should handle empty strings", () => {
    const result = truncateText("", 10);

    expect(result).toBe("");
  });

  it("should handle text exactly at maxLength", () => {
    const text = "exactly20characters!";
    const result = truncateText(text, 20);

    expect(result).toBe("exactly20characters!");
  });
});

describe("capitalize", () => {
  it("should capitalize the first letter of a string", () => {
    const result = capitalize("hello world");

    expect(result).toBe("Hello world");
  });

  it("should handle already capitalized strings", () => {
    const result = capitalize("Hello World");

    expect(result).toBe("Hello World");
  });

  it("should handle empty strings", () => {
    const result = capitalize("");

    expect(result).toBe("");
  });

  it("should handle single character strings", () => {
    const result = capitalize("a");

    expect(result).toBe("A");
  });

  it("should handle strings with numbers", () => {
    const result = capitalize("123abc");

    expect(result).toBe("123abc");
  });

  it("should handle strings starting with special characters", () => {
    const result = capitalize("!hello");

    expect(result).toBe("!hello");
  });
});

describe("camelCaseToWords", () => {
  it("should convert camelCase to space-separated words", () => {
    const result = camelCaseToWords("camelCaseExample");

    expect(result).toBe("camel Case Example");
  });

  it("should handle PascalCase", () => {
    const result = camelCaseToWords("PascalCaseExample");

    expect(result).toBe("Pascal Case Example");
  });

  it("should handle single words", () => {
    const result = camelCaseToWords("single");

    expect(result).toBe("single");
  });

  it("should handle empty strings", () => {
    const result = camelCaseToWords("");

    expect(result).toBe("");
  });

  it("should handle consecutive capitals", () => {
    const result = camelCaseToWords("XMLHttpRequest");

    expect(result).toBe("XML Http Request");
  });
});

describe("snakeCaseToWords", () => {
  it("should convert snake_case to space-separated words", () => {
    const result = snakeCaseToWords("snake_case_example");

    expect(result).toBe("snake case example");
  });

  it("should handle single words", () => {
    const result = snakeCaseToWords("single");

    expect(result).toBe("single");
  });

  it("should handle empty strings", () => {
    const result = snakeCaseToWords("");

    expect(result).toBe("");
  });

  it("should handle multiple consecutive underscores", () => {
    const result = snakeCaseToWords("word__with___underscores");

    expect(result).toBe("word  with   underscores");
  });
});

describe("kebabCaseToWords", () => {
  it("should convert kebab-case to space-separated words", () => {
    const result = kebabCaseToWords("kebab-case-example");

    expect(result).toBe("kebab case example");
  });

  it("should handle single words", () => {
    const result = kebabCaseToWords("single");

    expect(result).toBe("single");
  });

  it("should handle empty strings", () => {
    const result = kebabCaseToWords("");

    expect(result).toBe("");
  });

  it("should handle multiple consecutive hyphens", () => {
    const result = kebabCaseToWords("word--with---hyphens");

    expect(result).toBe("word  with   hyphens");
  });
});

describe("pluralize", () => {
  it("should return singular form for count of 1", () => {
    const result = pluralize(1, "item");

    expect(result).toBe("item");
  });

  it("should return plural form for count of 0", () => {
    const result = pluralize(0, "item");

    expect(result).toBe("items");
  });

  it("should return plural form for count greater than 1", () => {
    const result = pluralize(5, "item");

    expect(result).toBe("items");
  });

  it("should use custom plural form when provided", () => {
    const result = pluralize(2, "child", "children");

    expect(result).toBe("children");
  });

  it("should use custom plural form for count of 1", () => {
    const result = pluralize(1, "child", "children");

    expect(result).toBe("child");
  });

  it("should handle negative numbers", () => {
    const result = pluralize(-1, "item");

    expect(result).toBe("items");
  });
});

describe("formatCount", () => {
  it("should format count with singular word", () => {
    const result = formatCount(1, "item");

    expect(result).toBe("1 item");
  });

  it("should format count with plural word", () => {
    const result = formatCount(5, "item");

    expect(result).toBe("5 items");
  });

  it("should format count with custom plural", () => {
    const result = formatCount(3, "child", "children");

    expect(result).toBe("3 children");
  });

  it("should handle zero count", () => {
    const result = formatCount(0, "item");

    expect(result).toBe("0 items");
  });
});

describe("getInitials", () => {
  it("should extract initials from a full name", () => {
    const result = getInitials("John Doe");

    expect(result).toBe("JD");
  });

  it("should handle single name", () => {
    const result = getInitials("John");

    expect(result).toBe("J");
  });

  it("should handle three names with default maxInitials", () => {
    const result = getInitials("John Michael Doe");

    expect(result).toBe("JM");
  });

  it("should respect maxInitials parameter", () => {
    const result = getInitials("John Michael Doe", 3);

    expect(result).toBe("JMD");
  });

  it("should handle empty string", () => {
    const result = getInitials("");

    expect(result).toBe("");
  });

  it("should handle single character names", () => {
    const result = getInitials("J D");

    expect(result).toBe("JD");
  });

  it("should handle extra whitespace", () => {
    const result = getInitials("  John   Doe  ");

    expect(result).toBe("JD");
  });

  it("should convert to uppercase", () => {
    const result = getInitials("john doe");

    expect(result).toBe("JD");
  });
});

describe("stripHtml", () => {
  it("should remove HTML tags from text", () => {
    const html = "<p>Hello <strong>world</strong>!</p>";
    const result = stripHtml(html);

    expect(result).toBe("Hello world!");
  });

  it("should handle self-closing tags", () => {
    const html = "Text with <br/> line break";
    const result = stripHtml(html);

    expect(result).toBe("Text with  line break");
  });

  it("should handle nested tags", () => {
    const html = "<div><p>Nested <em>content</em></p></div>";
    const result = stripHtml(html);

    expect(result).toBe("Nested content");
  });

  it("should handle text without HTML", () => {
    const text = "Plain text without HTML";
    const result = stripHtml(text);

    expect(result).toBe("Plain text without HTML");
  });

  it("should handle empty string", () => {
    const result = stripHtml("");

    expect(result).toBe("");
  });

  it("should handle malformed HTML", () => {
    const html = "<p>Unclosed tag and <strong>another";
    const result = stripHtml(html);

    expect(result).toBe("Unclosed tag and another");
  });
});

describe("escapeHtml", () => {
  it("should escape HTML special characters", () => {
    const text = '<script>alert("XSS")</script>';
    const result = escapeHtml(text);

    expect(result).toBe("&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;");
  });

  it("should escape ampersands", () => {
    const text = "Tom & Jerry";
    const result = escapeHtml(text);

    expect(result).toBe("Tom &amp; Jerry");
  });

  it("should escape quotes", () => {
    const text = `He said "Hello" and 'Goodbye'`;
    const result = escapeHtml(text);

    expect(result).toBe("He said &quot;Hello&quot; and &#39;Goodbye&#39;");
  });

  it("should handle text without special characters", () => {
    const text = "Regular text without special chars";
    const result = escapeHtml(text);

    expect(result).toBe("Regular text without special chars");
  });

  it("should handle empty string", () => {
    const result = escapeHtml("");

    expect(result).toBe("");
  });

  it("should handle multiple special characters", () => {
    const text = `<div class="test" data-value='123'>Content & more</div>`;
    const result = escapeHtml(text);

    expect(result).toBe(
      "&lt;div class=&quot;test&quot; data-value=&#39;123&#39;&gt;Content &amp; more&lt;/div&gt;",
    );
  });
});
