const mongoose = require('mongoose');

/**
 * Start real-time cascade watchers using MongoDB change streams.
 * Note: Requires MongoDB replica set/Atlas. Handles User -> Student cascade on delete.
 * Student -> User delete is handled by periodic cleanup because pre-images may not be available.
 */
function startCascadeWatchers() {
  const connection = mongoose.connection;
  if (!connection || connection.readyState !== 1) {
    console.warn('[CascadeWatchers] Mongoose not connected; watchers not started');
    return () => {};
  }

  const User = mongoose.model('User');
  const Student = mongoose.model('Student');

  // Watch for User deletions and cascade delete linked Student immediately
  let userStream;
  try {
    userStream = User.watch([{ $match: { operationType: 'delete' } }], { fullDocument: 'default' });
    userStream.on('change', async change => {
      try {
        const deletedUserId = change.documentKey && change.documentKey._id;
        if (!deletedUserId) return;
        const res = await Student.deleteMany({ userId: deletedUserId });
        console.log(`[CascadeWatchers] User ${deletedUserId} deleted -> removed ${res.deletedCount || 0} student(s)`);
      } catch (err) {
        console.error('[CascadeWatchers] Error cascading on User delete:', err);
      }
    });
    if (process.env.DEBUG_WATCHERS === 'true') {
      console.log('[CascadeWatchers] User delete watcher started');
    }
  } catch (err) {
    if (process.env.DEBUG_WATCHERS === 'true') {
      console.warn('[CascadeWatchers] Change streams unavailable; falling back to periodic cleanup only');
    }
  }

  // Watch for Student deletions using pre-images to get email/userId
  let studentStream;
  try {
    studentStream = Student.watch([
      { $match: { operationType: 'delete' } }
    ], { fullDocument: 'default', fullDocumentBeforeChange: 'required' });

    studentStream.on('change', async change => {
      try {
        const before = change.fullDocumentBeforeChange || {};
        const userId = before.userId;
        const email = (before.email || '').toLowerCase();
        if (!userId && !email) return;
        const res = await User.deleteMany({
          $or: [
            ...(userId ? [{ _id: userId }] : []),
            ...(email ? [{ email, role: 'student' }] : [])
          ]
        });
        console.log(`[CascadeWatchers] Student deleted -> removed ${res.deletedCount || 0} linked user(s)`);
      } catch (err) {
        console.error('[CascadeWatchers] Error cascading on Student delete:', err);
      }
    });
    if (process.env.DEBUG_WATCHERS === 'true') {
      console.log('[CascadeWatchers] Student delete watcher started (pre-images required)');
    }
  } catch (err) {
    if (process.env.DEBUG_WATCHERS === 'true') {
      console.warn('[CascadeWatchers] Student delete watcher not started (pre-images likely disabled)');
    }
  }

  return function stop() {
    try { if (userStream) { userStream.removeAllListeners(); userStream.close(); } } catch (e) {}
    try { if (studentStream) { studentStream.removeAllListeners(); studentStream.close(); } } catch (e) {}
  };
}

module.exports = { startCascadeWatchers };


