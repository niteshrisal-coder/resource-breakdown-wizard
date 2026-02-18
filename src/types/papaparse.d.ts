declare module "papaparse" {
  export interface ParseResult<T> {
    data: T[];
    errors: any[];
    meta: any;
  }

  export function parse<T>(
    file: File | string,
    config?: {
      complete?: (results: ParseResult<T>) => void;
      header?: boolean;
      dynamicTyping?: boolean;
    },
  ): void;

  export function unparse(data: any): string;

  const Papa: {
    parse: typeof parse;
    unparse: typeof unparse;
  };

  export default Papa;
}