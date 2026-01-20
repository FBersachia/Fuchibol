const { errorHandler } = require('../src/middleware/errorHandler');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('errorHandler', () => {
  it('returns 500 for generic errors', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), {}, res, () => {});
    expect(res.statusCode).toBe(500);
  });
});
