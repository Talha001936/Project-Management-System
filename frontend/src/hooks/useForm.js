//note : Manages form data and input changes without writing repetitive useState code for every field.
import { useState } from 'react';

export function useForm(initialValues) {
  const [form, setForm] = useState(initialValues);
  const handleChange = field => e => {
    const value = e?.target?.value ?? e;
    setForm(prev => ({ ...prev, [field]: value }));
  };
  const handleMultiSelectChange = field => e => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };
  const handleSelectChange = field => e => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const resetForm = () => {
    setForm(initialValues);
  };

  return {
    form,
    setForm,
    handleChange,
    handleMultiSelectChange,
    handleSelectChange,
    resetForm,
  };
}
