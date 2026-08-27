const Activity = require('../models/Activity.model');

/**
 * Safe, non-blocking helper to log an activity event.
 * Never throws or blocks main controller execution.
 */
const logActivity = async ({
  userId,
  type,
  title,
  message,
  refId = null,
  refModel = null,
  metadata = {},
}) => {
  try {
    if (!userId || !type || !title || !message) {
      return null;
    }

    const activity = await Activity.create({
      userId,
      type,
      title,
      message,
      refId,
      refModel,
      metadata,
    });

    return activity;
  } catch (err) {
    console.error('[ActivityService] Failed to log activity:', err.message);
    return null;
  }
};

module.exports = {
  logActivity,
};
