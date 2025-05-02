export default {
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$)'
  ],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./src/setupTests.js'],
  moduleFileExtensions: ['js', 'jsx'],
  extensionsToTreatAsEsm: ['.jsx'],

  globals: {
    describe: true,
    test: true,
    expect: true,
    it: true,
    beforeAll: true,
    beforeEach: true,
    afterAll: true,
    afterEach: true,
    jest: true
  },

  testPathIgnorePatterns: [
    '.eslintrc.test.js'
  ]
}; 