// Polyfill DOM globals before any imports for Node.js serverless runtimes
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1;
      this.b = 0;
      this.c = 0;
      this.d = 1;
      this.e = 0;
      this.f = 0;
    }
    multiply() {
      return this;
    }
    translate() {
      return this;
    }
    scale() {
      return this;
    }
    rotate() {
      return this;
    }
    inverse() {
      return this;
    }
    transformPoint(p) {
      return p;
    }
  };
}
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = globalThis.DOMMatrix;
}
if (typeof globalThis.DOMPoint === 'undefined') {
  globalThis.DOMPoint = class DOMPoint {
    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.w = w;
    }
  };
}
if (typeof global.DOMPoint === 'undefined') {
  global.DOMPoint = globalThis.DOMPoint;
}

let app;
let loadError = null;

try {
  app = require('../server/server');
} catch (err) {
  loadError = err;
  console.error('FAILED TO LOAD SERVER:', err);
}

module.exports = (req, res) => {
  if (loadError) {
    return res.status(500).json({
      success: false,
      message: 'Server failed to load: ' + loadError.message,
      stack: loadError.stack,
    });
  }
  return app(req, res);
};
