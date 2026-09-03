// Note: This file is a custom React hook that manages form state. It provides a way to handle input 
// changes, select changes, multi-select changes, and form reset functionality. 
import { useState } from "react";

export function useForm(initialValues) {
  const [form, setForm] = useState(initialValues);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSelectChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleMultiSelectChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const resetForm = () => {
    setForm(initialValues);
  };

  return {
    form,
    setForm,
    handleChange,
    handleSelectChange,
    handleMultiSelectChange,
    resetForm,
  };
}