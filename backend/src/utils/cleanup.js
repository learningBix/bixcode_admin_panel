const mongoose = require('mongoose');

/**
 * Removes Users with role 'student' that no longer have a corresponding Student document
 * and Students whose linked User no longer exists.
 * This covers cases where Student rows are deleted manually in the database,
 * which bypasses Mongoose middleware hooks.
 */
async function removeOrphanedStudentUsers() {
  try {
    const User = mongoose.model('User');
    const Student = mongoose.model('Student');

    // Fetch Students and Users (role=student)
    const [students, studentUsers] = await Promise.all([
      Student.find({}, { _id: 1, userId: 1, email: 1 }).lean(),
      User.find({ role: 'student' }, { _id: 1, email: 1 }).lean()
    ]);

    const referencedUserIds = new Set(
      students.filter(s => s.userId).map(s => s.userId.toString())
    );
    const existingUserIds = new Set(studentUsers.map(u => u._id.toString()));
    const studentEmails = new Set(students.map(s => (s.email || '').toLowerCase()));
    const userEmails = new Set(studentUsers.map(u => (u.email || '').toLowerCase()));
    const referencedStudentIds = new Set(students.map(s => s._id.toString()));

    // Users not referenced by any Student via userId
    const orphanUserIdsByRef = studentUsers
      .map(u => u._id.toString())
      .filter(id => !referencedUserIds.has(id));

    // Users whose email no longer exists in Students (extra safety)
    const orphanUserIdsByEmail = studentUsers
      .filter(u => !studentEmails.has((u.email || '').toLowerCase()))
      .map(u => u._id.toString());

    // Students whose userId no longer exists in Users
    const orphanStudentIds = students
      .filter(s => s.userId && !existingUserIds.has(s.userId.toString()))
      .map(s => s._id.toString());

    // Students whose email no longer exists in Users (extra safety)
    const orphanStudentIdsByEmail = students
      .filter(s => !userEmails.has((s.email || '').toLowerCase()))
      .map(s => s._id.toString());

    let removedUsers = 0;
    let removedStudents = 0;

    const userIdsToRemove = Array.from(new Set([ ...orphanUserIdsByRef, ...orphanUserIdsByEmail ]));
    if (userIdsToRemove.length > 0) {
      await User.deleteMany({ _id: { $in: userIdsToRemove } });
      removedUsers = userIdsToRemove.length;
    }

    const studentIdsToRemove = Array.from(new Set([ ...orphanStudentIds, ...orphanStudentIdsByEmail ]));
    if (studentIdsToRemove.length > 0) {
      await Student.deleteMany({ _id: { $in: studentIdsToRemove } });
      removedStudents = studentIdsToRemove.length;
    }

    return { removedUsers, removedStudents };
  } catch (err) {
    console.error('[Cleanup] Error removing orphaned student users:', err);
    return { removed: 0, error: err };
  }
}

/**
 * Starts a periodic cleanup. Returns a stop function to clear the interval.
 * @param {object} opts
 * @param {number} opts.intervalMs - Interval in milliseconds (default 10 minutes)
 * @param {boolean} opts.runImmediately - Whether to run once immediately
 */
function startOrphanUserCleanup(opts = {}) {
  const intervalMs = typeof opts.intervalMs === 'number' ? opts.intervalMs : 10 * 60 * 1000;
  const runImmediately = opts.runImmediately !== false; // default true

  if (runImmediately) {
    removeOrphanedStudentUsers().then(result => {
      if (result && process.env.DEBUG_CLEANUP === 'true') {
        console.log(`[Cleanup] Initial cleanup — users removed: ${result.removedUsers || 0}, students removed: ${result.removedStudents || 0}`);
      }
    });
  }

  const intervalId = setInterval(async () => {
    const result = await removeOrphanedStudentUsers();
    if (result && process.env.DEBUG_CLEANUP === 'true') {
      console.log(`[Cleanup] Periodic cleanup — users removed: ${result.removedUsers || 0}, students removed: ${result.removedStudents || 0}`);
    }
  }, intervalMs);

  return function stop() {
    clearInterval(intervalId);
  };
}

module.exports = {
  startOrphanUserCleanup,
  removeOrphanedStudentUsers
};


