import React, { useState } from 'react';
import './register-student.css';
import { studentAPI } from '../../../utils/api';
import BulkEnrollModal from '../bulk-enroll-modal/bulk-enroll-modal';

const RegisterStudent = ({ onRegistered }) => {
  const [students, setStudents] = useState([
    {
      id: 1,
      name: '',
      email: '',
      phone: '',
      className: '',
      schoolName: ''
    }
  ]);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [issuedCredentials, setIssuedCredentials] = useState([]);

  const addStudentRow = () => {
    // Generate unique ID based on existing IDs to avoid conflicts
    const maxId = students.length > 0 ? Math.max(...students.map(s => s.id)) : 0;
    const newStudent = {
      id: maxId + 1,
      name: '',
      email: '',
      phone: '',
      className: '',
      schoolName: ''
    };
    setStudents([...students, newStudent]);
  };

  const removeStudentRow = (event, id) => {
    if (students.length > 1) {
      // Remove the specific student by ID
      const updatedStudents = students.filter(student => student.id !== id);
      setStudents(updatedStudents);
    }
  };

  const updateStudent = (id, field, value) => {
    setStudents(students.map(student => 
      student.id === id ? { ...student, [field]: value } : student
    ));
  };

  const clearAll = (preserveMessages = false) => {
    setStudents([{
      id: 1,
      name: '',
      email: '',
      phone: '',
      className: '',
      schoolName: ''
    }]);
    if (!preserveMessages) {
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  const handleBulkEnroll = () => {
    setShowBulkModal(true);
  };

  const handleFileUpload = async (file) => {
    try {
      setSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      // Process CSV file
      const text = await file.text();
      // Normalize Windows/Mac line endings and trim trailing empty newlines
      const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setErrorMessage('CSV file must contain at least a header and one data row.');
        return;
      }

      // Parse CSV
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const dataRows = lines.slice(1);
      
      const parsedStudents = dataRows.map((row, index) => {
        // Basic CSV split; handles simple CSV without quoted commas
        const values = row.split(',').map(v => v.trim());
        return {
          id: Date.now() + index,
          name: values[0] || '',
          email: values[1] || '',
          phone: values[2] || '',
          className: values[3] || '',
          schoolName: values[4] || ''
        };
      }).filter(student => student.name && student.email);

      if (parsedStudents.length === 0) {
        setErrorMessage('No valid student records found in the CSV file.');
        return;
      }

      // Update students state with parsed data
      setStudents(parsedStudents);
      setSuccessMessage(`${parsedStudents.length} students loaded from CSV file.`);
    } catch (error) {
      setErrorMessage('Failed to process CSV file. Please check the format and try again.');
      console.error('CSV processing error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCredentialsCSV = (creds) => {
    if (!Array.isArray(creds) || creds.length === 0) return;
    const header = ['Email', 'Password'];
    const rows = creds.map(c => [c.email, c.password]);
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_credentials.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const registerStudents = async () => {
    if (submitting) return;
    setErrorMessage('');
    setSuccessMessage('');

    const validStudents = students
      .map(s => ({
        name: s.name?.trim() || '',
        email: s.email?.trim() || '',
        phone: s.phone?.trim() || '',
        className: s.className?.trim() || '',
        schoolName: s.schoolName?.trim() || ''
      }))
      .filter(s => s.name && s.email && s.phone && s.className && s.schoolName);

    if (validStudents.length === 0) {
      setErrorMessage('Please enter at least one complete student record.');
      return;
    }

    try {
      setSubmitting(true);
      let newlyIssued = [];
      if (validStudents.length === 1) {
        const res = await studentAPI.createStudent(validStudents[0]);
        newlyIssued = res?.data?.credentials ? [res.data.credentials] : [];
        setIssuedCredentials(newlyIssued);
        setSuccessMessage('Student registered successfully. Credentials generated.');
      } else {
        const res = await studentAPI.createBulkStudents({ students: validStudents });
        newlyIssued = Array.isArray(res?.data?.credentials) ? res.data.credentials : [];
        setIssuedCredentials(newlyIssued);
        setSuccessMessage(`${validStudents.length} students registered successfully. Credentials generated.`);
      }
      // Reset inputs but keep success message visible
      clearAll(true);
      if (typeof onRegistered === 'function') {
        onRegistered(newlyIssued);
      }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 400 && data?.errors) {
        setErrorMessage('Validation failed. Please check the inputs.');
      } else if (status === 409) {
        if (Array.isArray(data?.duplicateEmails) && data.duplicateEmails.length > 0) {
          setErrorMessage(`Some students already exist: ${data.duplicateEmails.join(', ')}`);
        } else if (data?.message) {
          setErrorMessage(data.message);
        } else {
          setErrorMessage('Some students already exist.');
        }
      } else if (data?.message) {
        setErrorMessage(data.message);
      } else {
        setErrorMessage('Failed to register students. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-student">
      <h2>ADD STUDENTS TO FINISH CREATING YOUR CLASSROOM</h2>
      
      <div className="student-table-container">
        <table className="student-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>PHONE</th>
              <th>CLASS</th>
              <th>SCHOOL NAME</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={student.name}
                    onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="email"
                    placeholder="Enter email"
                    value={student.email}
                    onChange={(e) => updateStudent(student.id, 'email', e.target.value)}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="tel"
                    placeholder="Enter phone"
                    value={student.phone}
                    onChange={(e) => updateStudent(student.id, 'phone', e.target.value)}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Enter class"
                    value={student.className}
                    onChange={(e) => updateStudent(student.id, 'className', e.target.value)}
                    className="form-input"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    placeholder="Enter school"
                    value={student.schoolName}
                    onChange={(e) => updateStudent(student.id, 'schoolName', e.target.value)}
                    className="form-input"
                  />
                </td>
                <td>
                  <button
                    className="delete-button"
                    onClick={(e) => removeStudentRow(e, student.id)}
                    disabled={students.length === 1}
                  >
                    <span className="minus">-</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="action-buttons">
        <div className="left-actions">
          <button className="add-rows-button" onClick={addStudentRow}>
            Add Rows
          </button>
        </div>
        
        <div className="right-actions">
          <button className="bulk-enroll-button" onClick={handleBulkEnroll}>
            Bulk Enroll
          </button>
          
          <button className="clear-button" onClick={clearAll}>
            Clear
          </button>
        </div>
      </div>


      {errorMessage ? (
        <div className="error-message" style={{ color: '#b00020', marginTop: 12 }}>
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="success-message" style={{ color: '#1b5e20', marginTop: 12 }}>
          {successMessage}
          {issuedCredentials.length > 0 ? (
            <>
              <div style={{ marginTop: 8 }}>
                Generated credentials for {issuedCredentials.length} student(s).
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="bulk-enroll-button"
                  onClick={() => downloadCredentialsCSV(issuedCredentials)}
                >
                  Download Credentials CSV
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="register-section">
        <button className="register-button" onClick={registerStudents} disabled={submitting}>
          {submitting ? 'Registering...' : 'Register Students'}
        </button>
      </div>

      <BulkEnrollModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};

export default RegisterStudent;
