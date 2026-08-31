//Note : this file is used to create a custom hook for managing form state in React.
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