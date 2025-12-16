import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useMemo, useCallback } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'font': [] }, { 'size': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = useMemo(() => [
    'font', 'size', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'align', 'link'
  ], []);

  const handleChange = useCallback((content: string) => {
    onChange(content);
  }, [onChange]);

  return (
    <ReactQuill
      theme="snow"
      value={value || ''}
      onChange={handleChange}
      modules={modules}
      formats={formats}
      placeholder={placeholder}
      className={className}
      style={{ height: '200px', marginBottom: '50px' }}
    />
  );
};
