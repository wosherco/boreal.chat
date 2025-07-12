import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the $app/navigation module
const mockGoto = vi.hoisted(() => vi.fn());
vi.mock("$app/navigation", () => ({
  goto: mockGoto,
}));

import { ensureURL, gotoWithSeachParams } from "../../../src/lib/utils/navigate";

beforeEach(() => {
  mockGoto.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ensureURL", () => {
  it("should return a URL object when given a string", () => {
    const urlString = "https://example.com/path?param=value";
    const result = ensureURL(urlString);

    expect(result).toBeInstanceOf(URL);
    expect(result.toString()).toBe(urlString);
  });

  it("should return the same URL object when given a URL object", () => {
    const urlObject = new URL("https://example.com/path?param=value");
    const result = ensureURL(urlObject);

    expect(result).toBe(urlObject);
    expect(result).toBeInstanceOf(URL);
  });

  it("should handle URLs with complex search parameters", () => {
    const urlString =
      "https://example.com/path?param1=value1&param2=value2&param3=value%20with%20spaces";
    const result = ensureURL(urlString);

    expect(result.searchParams.get("param1")).toBe("value1");
    expect(result.searchParams.get("param2")).toBe("value2");
    expect(result.searchParams.get("param3")).toBe("value with spaces");
  });

  it("should handle URLs without search parameters", () => {
    const urlString = "https://example.com/path";
    const result = ensureURL(urlString);

    expect(result.pathname).toBe("/path");
    expect(result.search).toBe("");
  });
});

describe("gotoWithSeachParams", () => {
  it("should call goto with the URL and preserve other parameters", () => {
    const url = "https://example.com/path";
    const params = {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
      state: { test: "value" },
      searchParams: { param1: "value1" },
    };

    gotoWithSeachParams(url, params);

    expect(mockGoto).toHaveBeenCalledTimes(1);

    const [calledUrl, calledParams] = mockGoto.mock.calls[0];
    expect(calledUrl).toBeInstanceOf(URL);
    expect(calledUrl.toString()).toBe("https://example.com/path?param1=value1");
    expect(calledParams).toEqual({
      replaceState: true,
      noScroll: true,
      keepFocus: true,
      state: { test: "value" },
    });
  });

  it("should add new search parameters", () => {
    const url = "https://example.com/path";
    const params = {
      searchParams: {
        newParam: "newValue",
        anotherParam: "anotherValue",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("newParam")).toBe("newValue");
    expect(calledUrl.searchParams.get("anotherParam")).toBe("anotherValue");
  });

  it("should update existing search parameters", () => {
    const url = "https://example.com/path?existing=oldValue&keep=keepValue";
    const params = {
      searchParams: {
        existing: "newValue",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("existing")).toBe("newValue");
    expect(calledUrl.searchParams.get("keep")).toBe("keepValue");
  });

  it("should delete search parameters when value is undefined", () => {
    const url = "https://example.com/path?param1=value1&param2=value2&param3=value3";
    const params = {
      searchParams: {
        param1: "updatedValue",
        param2: undefined,
        param4: "newValue",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("param1")).toBe("updatedValue");
    expect(calledUrl.searchParams.get("param2")).toBe(null); // null means parameter doesn't exist
    expect(calledUrl.searchParams.get("param3")).toBe("value3");
    expect(calledUrl.searchParams.get("param4")).toBe("newValue");
  });

  it("should preserve existing search parameters when no searchParams are provided", () => {
    const url = "https://example.com/path?existing=value";
    const params = {};

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("existing")).toBe("value");
  });

  it("should handle empty searchParams object", () => {
    const url = "https://example.com/path?existing=value";
    const params = {
      searchParams: {},
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("existing")).toBe("value");
  });

  it("should handle null searchParams", () => {
    const url = "https://example.com/path?existing=value";
    const params = {
      searchParams: null,
    };

    // @ts-expect-error - Hard testing null
    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("existing")).toBe("value");
  });

  it("should work with URL objects as input", () => {
    const url = new URL("https://example.com/path?existing=value");
    const params = {
      searchParams: {
        newParam: "newValue",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("existing")).toBe("value");
    expect(calledUrl.searchParams.get("newParam")).toBe("newValue");
  });

  it("should handle special characters in search parameters", () => {
    const url = "https://example.com/path";
    const params = {
      searchParams: {
        special: "value with spaces & symbols!",
        encoded: "value%20already%20encoded",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("special")).toBe("value with spaces & symbols!");
    expect(calledUrl.searchParams.get("encoded")).toBe("value%20already%20encoded");
  });

  it("should handle multiple operations on the same parameter", () => {
    const url = "https://example.com/path?param=original";
    const params = {
      searchParams: {
        param: "updated",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("param")).toBe("updated");
  });

  it("should return the result of goto function", () => {
    const mockPromise = Promise.resolve();
    mockGoto.mockReturnValue(mockPromise);

    const url = "https://example.com/path";
    const params = { searchParams: { param: "value" } };

    const result = gotoWithSeachParams(url, params);

    expect(result).toBe(mockPromise);
  });

  it("should handle empty string values", () => {
    const url = "https://example.com/path";
    const params = {
      searchParams: {
        empty: "",
        notEmpty: "value",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl] = mockGoto.mock.calls[0];
    expect(calledUrl.searchParams.get("empty")).toBe("");
    expect(calledUrl.searchParams.get("notEmpty")).toBe("value");
  });

  it("should handle complex scenario with mixed operations", () => {
    const url = "https://example.com/path?keep=keepValue&update=oldValue&delete=deleteValue";
    const params = {
      replaceState: true,
      searchParams: {
        update: "newValue",
        delete: undefined,
        add: "addValue",
      },
    };

    gotoWithSeachParams(url, params);

    const [calledUrl, calledParams] = mockGoto.mock.calls[0];

    // Check URL
    expect(calledUrl.searchParams.get("keep")).toBe("keepValue");
    expect(calledUrl.searchParams.get("update")).toBe("newValue");
    expect(calledUrl.searchParams.get("delete")).toBe(null);
    expect(calledUrl.searchParams.get("add")).toBe("addValue");

    // Check other parameters
    expect(calledParams.replaceState).toBe(true);
    expect(calledParams.searchParams).toBeUndefined();
  });
});
