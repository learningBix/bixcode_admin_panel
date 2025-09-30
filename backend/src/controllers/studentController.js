const Student = require('../models/Student');
const { validationResult } = require('express-validator');

// Get all students with optional search and pagination
const getAllStudents = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Validate pagination parameters
    if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const students = await Student.searchStudents(search, pageNum, limitNum);
    const totalCount = await Student.getTotalCount(search);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: students,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
  }
};

// Get single student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student'
    });
  }
};

// Create new student
const User = require('../models/User');
const crypto = require('crypto');

function generatePassword() {
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}

const createStudent = async (req, res) => {
  try {
    console.log('[DEBUG] createStudent hit', {
      headers: req.headers && {
        authorization: req.headers.authorization,
        origin: req.headers.origin,
        host: req.headers.host
      }
    });
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, schoolName, className } = req.body;

    // Check if student with email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    // Create corresponding user credentials for the student
    const plainPassword = generatePassword();
    const user = new User({
      firstName: name.split(' ')[0] || name,
      lastName: name.split(' ').slice(1).join(' ') || '-',
      email,
      password: plainPassword,
      role: 'student'
    });
    await user.save();

    const student = new Student({
      name,
      email,
      phone,
      schoolName,
      className,
      initialPassword: plainPassword,
      userId: user._id
    });

    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student,
      credentials: {
        email,
        password: plainPassword
      }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create student'
    });
  }
};

// Bulk create students
const createBulkStudents = async (req, res) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Students array is required and cannot be empty'
      });
    }

    if (students.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create more than 100 students at once'
      });
    }

    // Validate each student
    const validationErrors = [];
    const validStudents = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const errors = [];

      if (!student.name || !student.name.trim()) {
        errors.push('Name is required');
      }
      if (!student.email || !student.email.trim()) {
        errors.push('Email is required');
      } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(student.email)) {
        errors.push('Invalid email format');
      }
      if (!student.phone || !student.phone.trim()) {
        errors.push('Phone is required');
      }
      if (!student.schoolName || !student.schoolName.trim()) {
        errors.push('School name is required');
      }
      if (!student.className || !student.className.trim()) {
        errors.push('Class name is required');
      }

      if (errors.length > 0) {
        validationErrors.push({
          row: i + 1,
          errors
        });
      } else {
        validStudents.push({
          name: student.name.trim(),
          email: student.email.trim().toLowerCase(),
          phone: student.phone.trim(),
          schoolName: student.schoolName.trim(),
          className: student.className.trim()
        });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed for some students',
        errors: validationErrors
      });
    }

    // Check for duplicate emails in Students and Users to avoid unique index errors
    const emails = validStudents.map(s => s.email);
    const [existingStudents, existingUsers] = await Promise.all([
      Student.find({ email: { $in: emails } }),
      User.find({ email: { $in: emails } })
    ]);

    const existingStudentEmails = existingStudents.map(s => s.email);
    const existingUserEmails = existingUsers.map(u => u.email);
    const duplicateEmails = Array.from(new Set([...existingStudentEmails, ...existingUserEmails]));

    if (duplicateEmails.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Some students already exist',
        duplicateEmails
      });
    }

    // Create users and students with credentials
    const createdUsers = [];
    const createdStudents = [];
    const issuedCredentials = [];

    for (const s of validStudents) {
      const plainPassword = generatePassword();
      const user = new User({
        firstName: (s.name || '').split(' ')[0] || s.name,
        lastName: (s.name || '').split(' ').slice(1).join(' ') || '-',
        email: s.email,
        password: plainPassword,
        role: 'student'
      });
      await user.save();
      createdUsers.push(user);

      const student = new Student({
        name: s.name,
        email: s.email,
        phone: s.phone,
        schoolName: s.schoolName,
        className: s.className,
        initialPassword: plainPassword,
        userId: user._id
      });
      await student.save();
      createdStudents.push(student);
      issuedCredentials.push({ email: s.email, password: plainPassword });
    }

    res.status(201).json({
      success: true,
      message: `${createdStudents.length} students created successfully`,
      data: createdStudents,
      credentials: issuedCredentials
    });
  } catch (error) {
    console.error('Error creating bulk students:', error);
    if (error && (error.code === 11000 || error.name === 'MongoServerError')) {
      return res.status(409).json({
        success: false,
        message: 'Some students already exist',
        duplicateEmails: []
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create students'
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, schoolName, className } = req.body;

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if email is being changed and if it already exists
    if (email) {
      const existingStudent = await Student.findOne({ 
        email, 
        _id: { $ne: id } 
      });
      
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'Student with this email already exists'
        });
      }
    }

    const student = await Student.findByIdAndUpdate(
      id,
      { name, email, phone, schoolName, className },
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student'
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First, find the student to get the userId before deleting
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Store userId for cascade deletion
    const userId = student.userId;

    // Delete the student record first
    await Student.findByIdAndDelete(id);

    // Delete the corresponding user record if it exists
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    res.json({
      success: true,
      message: 'Student and associated user account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student'
    });
  }
};

// Get student statistics
const getStudentStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const activeStudents = await Student.countDocuments({ isActive: true });
    const studentsThisMonth = await Student.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });

    // Get students by school
    const studentsBySchool = await Student.aggregate([
      { $group: { _id: '$schoolName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get students by class
    const studentsByClass = await Student.aggregate([
      { $group: { _id: '$className', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        studentsThisMonth,
        studentsBySchool,
        studentsByClass
      }
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student statistics'
    });
  }
};

// Validate student credentials (for BixCode integration)
const validateStudentCredentials = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find student by email
    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'No student found with this email address'
      });
    }

    // Find corresponding user to validate password
    const user = await User.findById(student.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Student account configuration error'
      });
    }

    // Check if student is active
    if (!student.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your student account is inactive. Please contact your teacher.'
      });
    }

    // For now, we'll use the initial password for validation
    // In a production system, you'd want to hash passwords properly
    if (password !== student.initialPassword) {
      return res.status(401).json({
        success: false,
        message: 'You entered wrong password. Please check your password and try again.'
      });
    }

    // Update last login
    student.lastLogin = new Date();
    await student.save();

    res.json({
      success: true,
      message: 'Credentials valid',
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        schoolName: student.schoolName,
        className: student.className,
        phone: student.phone
      }
    });
  } catch (error) {
    console.error('Error validating credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate credentials'
    });
  }
};

// Reset student password
const resetStudentPassword = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, current password, and new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Find student by email
    const student = await Student.findOne({ email: email.toLowerCase() });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find corresponding user
    const user = await User.findById(student.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    // Check if student is active
    if (!student.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Student account is inactive'
      });
    }

    // Verify current password
    if (currentPassword !== student.initialPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update user password (this will be hashed automatically by the pre-save hook)
    user.password = newPassword;
    await user.save();

    // Update student's initial password record
    student.initialPassword = newPassword;
    await student.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// Save student project to cloud
const saveStudentProject = async (req, res) => {
  try {
    const { studentId, email, projectTitle, projectData, savedAt } = req.body;

    if (!studentId || !email || !projectTitle || !projectData) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, email, project title, and project data are required'
      });
    }

    // Find student by ID and email
    const student = await Student.findOne({ 
      _id: studentId, 
      email: email.toLowerCase() 
    });
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Create or update project in the student's projects array
    const project = {
      projectTitle,
      projectData,
      savedAt: savedAt || new Date(),
      projectId: require('crypto').randomBytes(12).toString('hex')
    };

    // Add project to student's projects array
    if (!student.projects) {
      student.projects = [];
    }
    
    student.projects.push(project);
    await student.save();

    res.json({
      success: true,
      message: 'Project saved successfully',
      projectId: project.projectId
    });
  } catch (error) {
    console.error('Error saving project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save project'
    });
  }
};

// Load all projects for a student
const loadStudentProjects = async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const projects = student.projects || [];

    res.json({
      success: true,
      projects: projects
    });
  } catch (error) {
    console.error('Error loading projects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load projects'
    });
  }
};

// Load a specific project by ID
const loadStudentProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const project = student.projects?.find(p => p._id.toString() === projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      project: project
    });
  } catch (error) {
    console.error('Error loading project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load project'
    });
  }
};

// Delete a specific project by ID
const deleteStudentProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required'
      });
    }

    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const projectIndex = student.projects?.findIndex(p => p._id.toString() === projectId);
    
    if (projectIndex === -1 || !student.projects || projectIndex === undefined) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Remove the project from the array
    const deletedProject = student.projects[projectIndex];
    student.projects.splice(projectIndex, 1);
    await student.save();

    res.json({
      success: true,
      message: 'Project deleted successfully',
      deletedProject: {
        id: deletedProject._id,
        title: deletedProject.projectTitle,
        deletedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project'
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  createBulkStudents,
  updateStudent,
  deleteStudent,
  getStudentStats,
  validateStudentCredentials,
  resetStudentPassword,
  saveStudentProject,
  loadStudentProjects,
  loadStudentProject,
  deleteStudentProject
};
