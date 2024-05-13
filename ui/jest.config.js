module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'ts-jest'
  },
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy'
  },
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js']
}
