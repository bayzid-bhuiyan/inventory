import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Form, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import SimpleMdeReact from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import api from '../../services/api';

const SettingsTab = ({ inventory, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: inventory.title || '',
    category: inventory.category || 'Equipment',
    description: inventory.description || '',
    tags: inventory.tags || [] 
  });
  
  const [currentVersion, setCurrentVersion] = useState(inventory.version);
  const [saveStatus, setSaveStatus] = useState('idle'); 
  const [errorMessage, setErrorMessage] = useState('');

  const [existingTags, setExistingTags] = useState([]);
  const [currentTagInput, setCurrentTagInput] = useState('');

  const isDirty = useRef(false);

  const mdeOptions = useMemo(() => ({
    spellChecker: false,
    autofocus: false,
    status: false, 
    placeholder: "Write a detailed description here...",
  }), []);

  useEffect(() => {
    api.get('/inventories').then(res => {
      const tags = new Set();
      if (Array.isArray(res.data?.data)) {
        res.data.data.forEach(inv => {
          inv.tags?.forEach(t => tags.add(t.name));
        });
      }
      setExistingTags(Array.from(tags));
    }).catch(err => console.error("Failed to fetch tags", err));
  }, []);
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    isDirty.current = true; 
    setSaveStatus('pending');
  };

  const handleMarkdownChange = (value) => {
    setFormData(prev => ({ ...prev, description: value }));
    isDirty.current = true;
    setSaveStatus('pending');
  };
  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && currentTagInput.trim()) {
      e.preventDefault();
      const cleanTag = currentTagInput.trim().toLowerCase();
      
      const currentTags = formData.tags || [];
      if (!currentTags.some(t => (t.name || t) === cleanTag)) {
        const newTags = [...currentTags, { name: cleanTag }];
        setFormData(prev => ({ ...prev, tags: newTags }));
        isDirty.current = true;
        setSaveStatus('pending');
      }
      setCurrentTagInput('');
    }
  };
  const removeTag = (tagName) => {
    const currentTags = formData.tags || [];
    const newTags = currentTags.filter(t => (t.name || t) !== tagName);
    setFormData(prev => ({ ...prev, tags: newTags }));
    isDirty.current = true;
    setSaveStatus('pending');
  };
  useEffect(() => {
    if (!isDirty.current) return;
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      setErrorMessage('');

      try {
        const tagsToSend = (formData.tags || []).map(tag => tag.name || tag);
        const response = await api.patch(`/inventories/${inventory.id}/auto-save`, {
          title: formData.title,
          category: formData.category,
          description: formData.description,
          tags: tagsToSend,
          currentVersion: currentVersion 
        });

        setCurrentVersion(response.data.data.version);
        setSaveStatus('saved');
        isDirty.current = false;
        
        if (onUpdate) onUpdate(response.data.data);
        setTimeout(() => setSaveStatus('idle'), 3000);

      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus('error');
        if (error.response?.status === 409) {
          setErrorMessage("Conflict: Someone else modified this inventory. Please refresh.");
        } else {
          setErrorMessage("Auto-save failed. Check connection.");
        }
      }
    }, 2000); 

    return () => clearTimeout(timer);
  }, [formData, inventory.id, currentVersion]); 

  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">General Settings</h4>
        
        <div style={{ minWidth: '150px', textAlign: 'right' }}>
          {saveStatus === 'pending' && <span className="text-muted small">Unsaved changes...</span>}
          {saveStatus === 'saving' && <span className="text-muted"><Spinner animation="border" size="sm" className="me-2" /> Saving...</span>}
          {saveStatus === 'saved' && <span className="text-success fw-bold">✓ Saved</span>}
          {saveStatus === 'error' && <span className="text-danger fw-bold">⚠️ Error</span>}
        </div>
      </div>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Inventory Title</Form.Label>
              <Form.Control 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Category</Form.Label>
              <Form.Select name="category" value={formData.category} onChange={handleChange}>
                <option value="Equipment">Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Book">Book</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Description (Markdown Supported)</Form.Label>
          <SimpleMdeReact 
            value={formData.description} 
            onChange={handleMarkdownChange}
            options={mdeOptions}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-bold">Tags</Form.Label>
          <div className="mb-2">
            {(formData.tags || []).map((tag, idx) => (
              <Badge bg="primary" key={idx} className="me-2 p-2 fs-6">
                {tag.name || tag} 
                <span 
                    style={{cursor: 'pointer', marginLeft: '5px'}} 
                    onClick={() => removeTag(tag.name || tag)}
                > &times; </span>
              </Badge>
            ))}
          </div>
          <Form.Control
            type="text"
            placeholder="Type a tag and press Enter or Comma"
            value={currentTagInput}
            onChange={(e) => setCurrentTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            list="existing-tags" 
          />
          <datalist id="existing-tags">
            {existingTags.map((tag, idx) => (
              <option key={idx} value={tag} />
            ))}
          </datalist>
          <Form.Text className="text-muted">
            Changes save automatically 2 seconds after you stop typing.
          </Form.Text>
        </Form.Group>
      </Form>
    </div>
  );
};

export default SettingsTab;