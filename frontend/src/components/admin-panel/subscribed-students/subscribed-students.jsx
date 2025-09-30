import React, { useState, useEffect } from 'react';
import './subscribed-students.css';
import { studentAPI } from '../../../utils/api';

const SubscribedStudents = ({ reloadKey = 0, recentCredentials = [] }) => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [deletingId, setDeletingId] = useState(null);
  const [showCreds, setShowCreds] = useState(true);

  // Determine status based on dates when backend doesn't provide one
  const computeDerivedStatus = ({ subscriptionDate, expiresAt }) => {
    const nowMs = Date.now();
    const expiresMs = expiresAt ? new Date(expiresAt).getTime() : NaN;
    const hasSubscription = !!subscriptionDate;
    if (!hasSubscription) return 'Pending';
    if (!Number.isNaN(expiresMs)) {
      return nowMs < expiresMs ? 'Active' : 'Expired';
    }
    return 'Active';
  };

  // Utility: merge passwords from recent credentials into a list of students
  const mergeRecentPasswords = (list) => {
    if (!Array.isArray(list) || !Array.isArray(recentCredentials) || recentCredentials.length === 0) return list;
    const map = new Map();
    for (const c of recentCredentials) {
      if (c && c.email) map.set(String(c.email).toLowerCase(), c.password || '');
    }
    return list.map(s => {
      const emailKey = String(s.email || '').toLowerCase();
      const pwd = map.get(emailKey);
      return pwd ? { ...s, password: pwd } : s;
    });
  };

  // Fetch students from API
  useEffect(() => {
    let cancelled = false;
    async function fetchStudents() {
      try {
        setLoading(true);
        const res = await studentAPI.getStudents({ page: 1, limit: 100 });
        if (cancelled) return;
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        // Normalize to avoid undefined fields breaking UI logic
        const normalized = data.map(s => {
          const subscriptionDate = s.subscriptionDate || s.createdAt || '';
          const expiresAt = s.expiresAt || '';
          const providedStatus = s.status || '';
          const derivedStatus = computeDerivedStatus({ subscriptionDate, expiresAt });
          return {
            id: s.id || s._id,
            name: s.name || '',
            email: s.email || '',
            phone: s.phone || '',
            className: s.className || '',
            schoolName: s.schoolName || '',
            subscriptionDate,
            expiresAt,
            status: providedStatus || derivedStatus,
            // Persisted from backend for refresh survival
            password: s.initialPassword || ''
          };
        });
        const withPwds = mergeRecentPasswords(normalized);
        setStudents(withPwds);
        setFilteredStudents(withPwds);
      } catch (e) {
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStudents();
    return () => { cancelled = true; };
  }, [reloadKey]);

  // Overlay recent credentials onto current lists when they change
  useEffect(() => {
    if (!Array.isArray(students) || students.length === 0) return;
    const updated = mergeRecentPasswords(students);
    setStudents(updated);
    setFilteredStudents(prev => mergeRecentPasswords(prev));
  }, [recentCredentials]);

  // Search and filter functionality
  useEffect(() => {
    let filtered = students;

    if (searchTerm) {
      filtered = students.filter(student => {
        const searchLower = searchTerm.toLowerCase();
        switch (searchField) {
          case 'name':
            return (student.name || '').toLowerCase().includes(searchLower);
          case 'email':
            return (student.email || '').toLowerCase().includes(searchLower);
          case 'phone':
            return (student.phone || '').includes(searchTerm);
          case 'className':
            return (student.className || '').toLowerCase().includes(searchLower);
          case 'schoolName':
            return (student.schoolName || '').toLowerCase().includes(searchLower);
          default:
            return (
              (student.name || '').toLowerCase().includes(searchLower) ||
              (student.email || '').toLowerCase().includes(searchLower) ||
              (student.phone || '').includes(searchTerm) ||
              (student.className || '').toLowerCase().includes(searchLower) ||
              (student.schoolName || '').toLowerCase().includes(searchLower)
            );
        }
      });
    }

    // Sort functionality
    filtered.sort((a, b) => {
      let aValue = (a[sortField] ?? '');
      let bValue = (b[sortField] ?? '');

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, searchField, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handleExport = () => {
    // Export functionality - could be CSV, Excel, etc.
    const csvContent = [
      ['Name', 'Email', 'Password', 'Phone', 'Class', 'School', 'Subscription Date', 'Status'],
      ...filteredStudents.map(student => [
        student.name,
        student.email,
        student.password || '',
        student.phone,
        student.className,
        student.schoolName,
        student.subscriptionDate,
        student.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribed_students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    const confirmed = window.confirm('Remove this student?');
    if (!confirmed) return;
    try {
      setDeletingId(id);
      await studentAPI.deleteStudent(id);
      // Remove from both lists
      const nextStudents = students.filter(s => s.id !== id);
      setStudents(nextStudents);
      setFilteredStudents(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      // Log for debugging; could show toast
      // eslint-disable-next-line no-console
      console.warn('Failed to delete student', id, e?.response?.status, e?.response?.data);
    } finally {
      setDeletingId(null);
    }
  };


  // Static table headers rendered in a readable, maintainable way
  const tableHeaders = [
    'S.NO',
    'Name',
    'Email',
    'Password',
    'Phone',
    'Class',
    'School Name',
    'Subscribed',
    'Status',
    'Actions'
  ];

  return (
    <div className="subscribed-students">
      {Array.isArray(recentCredentials) && recentCredentials.length > 0 && showCreds ? (
        <div className="credentials-panel" style={{
          marginBottom: 16,
          border: '1px solid #c8e6c9',
          background: '#e8f5e9',
          padding: 12,
          borderRadius: 8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Recently generated credentials</strong>
            <button onClick={() => setShowCreds(false)} className="clear-button" style={{ padding: '4px 8px' }}>Hide</button>
          </div>
          <div style={{ marginTop: 8, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Email</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>Password</th>
                </tr>
              </thead>
              <tbody>
                {recentCredentials.map((c, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '6px 8px' }}>{c.email}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{c.password}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      <div className="students-header">
        <h2>Subscribed Students Management</h2>
        <div className="header-actions">
          <button className="export-button" onClick={handleExport}>
            📊 Export CSV
          </button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-container">
          <div className="search-input-group">
            <select
              className="search-field-select"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="all">All Fields</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="className">Class Name</option>
              <option value="schoolName">School Name</option>
            </select>
            <input
              type="text"
              className="search-input"
              placeholder={`Search by ${searchField === 'all' ? 'all fields' : searchField}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          </div>
          <div className="search-stats">
            Showing {filteredStudents.length} of {students.length} students
          </div>
        </div>
      </div>

      <div className="students-table-container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : (
          <table className="students-table">
            <thead
              onMouseOver={(e) => {
                if (e.target && e.target.tagName === 'TH') {
                  e.target.style.backgroundColor = 'inherit';
                }
              }}
              onMouseOut={(e) => {
                if (e.target && e.target.tagName === 'TH') {
                  e.target.style.backgroundColor = '';
                }
              }}
            >
              <tr>
                {tableHeaders.map(label => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">
                    {searchTerm ? 'No students found matching your search criteria.' : 'No students found.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.password ? student.password : '-'}</td>
                    <td>{student.phone}</td>
                    <td>{student.className}</td>
                    <td>{student.schoolName}</td>
                    <td>{student.subscriptionDate ? new Date(student.subscriptionDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</td>
                    <td>
                      <span className={`status-badge ${(student.status || 'Unknown').toLowerCase()}`}>
                        {student.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* <button className="view-button" title="View Details">
                          👁️
                        </button> */}
                        {/* <button className="edit-button" title="Edit Student">
                          ✏️
                        </button> */}
                        <button
                          className="delete-button"
                          title="Remove Student"
                          onClick={() => handleDelete(student.id)}
                          disabled={deletingId === student.id}
                        >
                          <span className="minus">{deletingId === student.id ? '…' : '-'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SubscribedStudents;
