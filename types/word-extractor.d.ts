declare module 'word-extractor' {
  interface WordDocument {
    getBody(): string;
  }

  class WordExtractor {
    extract(source: Buffer): Promise<WordDocument>;
  }

  export = WordExtractor;
}
