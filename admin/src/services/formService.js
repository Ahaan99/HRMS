import API from "./api";

// GET all candidate forms
export const getCandidateForms = async (page = 1, limit = 50) => {
  const res = await API.get(`/forms?type=candidate&page=${page}&limit=${limit}`);
  return res.data; // { forms: [...], pagination: { pages, total } }
};

// GET all client forms
export const getClientForms = async (page = 1, limit = 50) => {
  const res = await API.get(`/forms?type=client&page=${page}&limit=${limit}`);
  return res.data;
};

// GET all forms
export const getAllForms = async (page = 1, limit = 50) => {
  const res = await API.get(`/forms?page=${page}&limit=${limit}`);
  return res.data;
};

// GET single form
export const getFormById = async (id) => {
  const res = await API.get(`/forms/${id}`);
  return res.data;
};

// UPDATE form status
export const updateFormStatus = async (id, status) => {
  const res = await API.put(`/forms/${id}`, { status });
  return res.data;
};

// DELETE form
export const deleteForm = async (id) => {
  const res = await API.delete(`/forms/${id}`);
  return res.data;
};