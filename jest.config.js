
module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: false,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  verbose: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // A set of global variables that need to be available in all test environments
  globals: {
    "ts-jest": {
      "tsConfig": "tsconfig.json"
    }
  },

  // An array of file extensions your modules use
  moduleFileExtensions: [
      "js", "ts"
  ],

  // A list of paths to directories that Jest should use to search for files in
  roots: [
     "test"
   ],

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/*spec.ts"
  ],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest"
  }
};
