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
