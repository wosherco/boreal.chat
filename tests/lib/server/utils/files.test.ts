import { describe, it, expect } from "vitest";
import { cleanFileName } from "../../../../src/lib/server/utils/files";

describe("server files utilities", () => {
  describe("cleanFileName", () => {
    it("should keep alphanumeric characters", () => {
      expect(cleanFileName("HelloWorld123")).toBe("HelloWorld123");
      expect(cleanFileName("abc123")).toBe("abc123");
      expect(cleanFileName("ABC123")).toBe("ABC123");
    });

    it("should keep dashes", () => {
      expect(cleanFileName("file-name")).toBe("file-name");
      expect(cleanFileName("my-file-123")).toBe("my-file-123");
      expect(cleanFileName("-dash-prefix")).toBe("-dash-prefix");
      expect(cleanFileName("dash-suffix-")).toBe("dash-suffix-");
    });

    it("should keep underscores", () => {
      expect(cleanFileName("file_name")).toBe("file_name");
      expect(cleanFileName("my_file_123")).toBe("my_file_123");
      expect(cleanFileName("_underscore_prefix")).toBe("_underscore_prefix");
      expect(cleanFileName("underscore_suffix_")).toBe("underscore_suffix_");
    });

    it("should keep file extensions", () => {
      expect(cleanFileName("document.pdf")).toBe("document.pdf");
      expect(cleanFileName("image.jpg")).toBe("image.jpg");
      expect(cleanFileName("script.js")).toBe("script.js");
      expect(cleanFileName("data.json")).toBe("data.json");
      expect(cleanFileName("archive.tar.gz")).toBe("archive.tar.gz");
    });

    it("should handle mixed valid characters", () => {
      expect(cleanFileName("my-file_123.pdf")).toBe("my-file_123.pdf");
      expect(cleanFileName("user-profile_2024.json")).toBe("user-profile_2024.json");
      expect(cleanFileName("test-data_v2.1.xlsx")).toBe("test-data_v2.1.xlsx");
    });

    it("should remove spaces", () => {
      expect(cleanFileName("file name")).toBe("filename");
      expect(cleanFileName("my document.pdf")).toBe("mydocument.pdf");
      expect(cleanFileName("  spaced  file  ")).toBe("spacedfile");
    });

    it("should remove special characters", () => {
      expect(cleanFileName("file@name")).toBe("filename");
      expect(cleanFileName("my#file.pdf")).toBe("myfile.pdf");
      expect(cleanFileName("test$file")).toBe("testfile");
      expect(cleanFileName("file%name")).toBe("filename");
      expect(cleanFileName("file^name")).toBe("filename");
      expect(cleanFileName("file&name")).toBe("filename");
      expect(cleanFileName("file*name")).toBe("filename");
      expect(cleanFileName("file(name)")).toBe("filename");
      expect(cleanFileName("file[name]")).toBe("filename");
      expect(cleanFileName("file{name}")).toBe("filename");
    });

    it("should remove non-ASCII characters", () => {
      expect(cleanFileName("café.pdf")).toBe("caf.pdf");
      expect(cleanFileName("résumé.docx")).toBe("rsum.docx");
      expect(cleanFileName("naïve.txt")).toBe("nave.txt");
      expect(cleanFileName("über.json")).toBe("ber.json");
    });

    it("should handle empty strings", () => {
      expect(cleanFileName("")).toBe("");
    });

    it("should handle strings with only special characters", () => {
      expect(cleanFileName("!@#$%^&*()")).toBe("");
      expect(cleanFileName("   ")).toBe("");
      expect(cleanFileName("@@@")).toBe("");
    });

    it("should preserve multiple dots for extensions", () => {
      expect(cleanFileName("archive.tar.gz")).toBe("archive.tar.gz");
      expect(cleanFileName("config.backup.json")).toBe("config.backup.json");
      expect(cleanFileName("file.backup.old.txt")).toBe("file.backup.old.txt");
    });

    it("should handle filenames with multiple dashes and underscores", () => {
      expect(cleanFileName("my--file--name")).toBe("my--file--name");
      expect(cleanFileName("file__name__test")).toBe("file__name__test");
      expect(cleanFileName("mixed--file__name")).toBe("mixed--file__name");
    });

    it("should handle edge cases", () => {
      expect(cleanFileName(".")).toBe(".");
      expect(cleanFileName("..")).toBe("..");
      expect(cleanFileName("...")).toBe("...");
      expect(cleanFileName(".hidden")).toBe(".hidden");
      expect(cleanFileName("file.")).toBe("file.");
    });

    it("should handle numbers and letters mixed with valid characters", () => {
      expect(cleanFileName("file123_456-789.pdf")).toBe("file123_456-789.pdf");
      expect(cleanFileName("2024-01-15_report.json")).toBe("2024-01-15_report.json");
      expect(cleanFileName("v2.1.0-release_notes.md")).toBe("v2.1.0-release_notes.md");
    });

    it("should remove control characters", () => {
      expect(cleanFileName("file\x00name")).toBe("filename");
      expect(cleanFileName("file\x1Fname")).toBe("filename");
      expect(cleanFileName("file\x7Fname")).toBe("filename");
    });

    it("should handle unicode whitespace", () => {
      expect(cleanFileName("file\u00A0name")).toBe("filename"); // non-breaking space
      expect(cleanFileName("file\u2000name")).toBe("filename"); // en quad
      expect(cleanFileName("file\u2001name")).toBe("filename"); // em quad
    });
  });
});
