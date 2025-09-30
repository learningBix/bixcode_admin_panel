import axios from 'axios';

// Configure axios defaults locally so this module can work standalone.
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
axios.defaults.baseURL = API_BASE_URL;

// Do not set a global Authorization header by default. Some environments reject
// requests with an invalid/stale token even for public endpoints. Attach tokens
// explicitly in authenticated areas instead.
if (axios.defaults.headers?.common?.Authorization) {
  delete axios.defaults.headers.common['Authorization'];
}

const STUDENTS_BASE = '/students';

export const studentAPI = {
  async getStudents({ page = 1, limit = 50 } = {}) {
    return axios.get(STUDENTS_BASE, { params: { page, limit } });
  },

  async createStudent(payload) {
    // payload: { name, email, phone, className, schoolName }
    return axios.post(STUDENTS_BASE, payload, { headers: { Authorization: undefined } });
  },

  async createBulkStudents(payload) {
    // payload: { students: Array<student> }
    return axios.post(`${STUDENTS_BASE}/bulk`, payload, { headers: { Authorization: undefined } });
  },

  async deleteStudent(id) {
    return axios.delete(`${STUDENTS_BASE}/${id}`);
  }
};

export default { studentAPI };


