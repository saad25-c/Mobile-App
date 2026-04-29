import { API_URL } from '../constants/api';

const headers = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

// LESSONS 
export const fetchLessons = async (token) => {
  const res = await fetch(`${API_URL}/api/teacher/lessons`, {
    headers: headers(token),
  });
  const data = await res.json();
  return data.data || [];
};

// ABSENCES 
export const fetchAbsences = async (token) => {
  const res = await fetch(`${API_URL}/api/teacher/absences`, {
    headers: headers(token),
  });
  const data = await res.json();
  return data.data || [];
};

export const declareAbsence = async (token, body) => {
  const res = await fetch(`${API_URL}/api/teacher/absence`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
};

export const deleteAbsence = async (token, absenceId) => {
  const res = await fetch(`${API_URL}/api/teacher/absence/${absenceId}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  return res.status;
};

// ATTENDANCE 
export const fetchStudents = async (token, groupId) => {
  const res = await fetch(`${API_URL}/api/groups/${groupId}/students`, {
    headers: headers(token),
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const saveAttendances = async (token, lessonId, date, attendances) => {
  const res = await fetch(`${API_URL}/api/attendance/bulk`, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify({ lessonId, date, attendances }),
  });
  return res.status;
};

// DOCUMENTS 
export const fetchDocuments = async (token, teacherId) => {
  const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents`, {
    headers: headers(token),
  });
  const data = await res.json();
  return data.documents || [];
};

export const fetchArchivedDocuments = async (token, teacherId) => {
  const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents/archived`, {
    headers: headers(token),
  });
  const data = await res.json();
  return data.documents || [];
};

export const saveDocument = async (token, teacherId, body, documentId = null) => {
  const url = documentId
    ? `${API_URL}/api/teachers/${teacherId}/documents/${documentId}`
    : `${API_URL}/api/teachers/${teacherId}/documents`;
  const res = await fetch(url, {
    method: documentId ? 'PUT' : 'POST',
    headers: headers(token),
    body: JSON.stringify({ ...body, fileSize: body.fileSize < 1 ? 1 : body.fileSize }),
  });
  return { status: res.status, data: await res.json() };
};

export const archiveDocument = async (token, teacherId, documentId) => {
  const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents/${documentId}/deactivate`, {
    method: 'PUT',
    headers: headers(token),
  });
  return res.status;
};

export const reactivateDocument = async (token, teacherId, documentId) => {
  const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents/${documentId}/reactivate`, {
    method: 'PUT',
    headers: headers(token),
  });
  return res.status;
};

export const deleteDocument = async (token, teacherId, documentId) => {
  const res = await fetch(`${API_URL}/api/teachers/${teacherId}/documents/${documentId}/permanent`, {
    method: 'DELETE',
    headers: headers(token),
  });
  return res.status;
};

// DISPONIBILITES 
export const fetchDispos = async (token, teacherId) => {
  const res = await fetch(`${API_URL}/api/teachers/${teacherId}/dispo`, {
    headers: headers(token),
  });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

export const saveDispo = async (token, teacherId, body, dispoId = null) => {
  const url = dispoId
    ? `${API_URL}/api/teachers/${teacherId}/dispo/${dispoId}`
    : `${API_URL}/api/teachers/${teacherId}/dispo`;
  const res = await fetch(url, {
    method: dispoId ? 'PUT' : 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
};

export const deleteDispo = async (token, teacherId, dispoId) => {
  const res = await fetch(`${API_URL}/api/teachers/${teacherId}/dispo/${dispoId}`, {
    method: 'DELETE',
    headers: headers(token),
  });
  return res.status;
};