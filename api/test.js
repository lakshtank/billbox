module.exports = (req, res) => {
  res.status(200).json({ success: true, message: 'Serverless basic test route is working!' });
};
