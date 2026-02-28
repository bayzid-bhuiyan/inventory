import React, { useState } from 'react';
import { Form, Button, Row, Col, Card, Spinner } from 'react-bootstrap';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { FaGripVertical, FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import api from '../../services/api';

const CustomFieldsTab = ({ inventory, onUpdate }) => {
 
  const [fields, setFields] = useState(inventory.customFieldDefs || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleDragEnd = (result) => {
    if (!result.destination) return; 

    const reorderedFields = Array.from(fields);
    const [movedItem] = reorderedFields.splice(result.source.index, 1);
    reorderedFields.splice(result.destination.index, 0, movedItem);

    setFields(reorderedFields);
  };
  const addField = () => {
    const fieldTypes = ['text', 'textarea', 'number', 'link', 'boolean', 'date'];
    const availableType = fieldTypes.find(type => fields.filter(f => f.type === type).length < 3);

    if (!availableType) {
      return alert("You have reached the maximum number of custom fields for all types.");
    }

    const newField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, 
      name: '',
      type: availableType,
      showInTable: true 
    };
    setFields([...fields, newField]);
  };

  const updateField = (index, key, value) => {
    if (key === 'type') {
      const currentTypeCount = fields.filter((f, i) => i !== index && f.type === value).length;
      if (currentTypeCount >= 3) {
        return alert(`You can only have up to 3 fields of type "${value}".`);
      }
    }

    const updatedFields = [...fields];
    updatedFields[index][key] = value;
    setFields(updatedFields);
  };

  const deleteField = (index) => {
    const updatedFields = [...fields];
    updatedFields.splice(index, 1);
    setFields(updatedFields);
  };

  const handleSave = async () => {
    if (fields.some(f => f.name.trim() === '')) {
      return alert("All fields must have a name.");
    }

    setIsSaving(true);
    try {
      const response = await api.patch(`/inventories/${inventory.id}/auto-save`, {
        customFieldDefs: fields,
        currentVersion: inventory.version
      });
      
      onUpdate(response.data.data); 
      alert("Custom fields saved successfully!");
    } catch (error) {
      console.error("Failed to save fields:", error);
      if (error.response?.status === 409) {
        alert("Conflict: Someone else modified this inventory. Please refresh.");
      } else {
        alert("Failed to save. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">Custom Data Fields</h4>
          <p className="text-muted small mb-0">Define the exact data you want to collect for items in this inventory.</p>
        </div>
        <Button variant="success" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Spinner animation="border" size="sm" /> : <><FaSave className="me-2" /> Save Configuration</>}
        </Button>
      </div>

      <Card className="bg-light border-0 shadow-sm p-3 mb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="custom-fields">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                
                {fields.length === 0 && (
                  <div className="text-center p-4 text-muted border border-dashed rounded bg-white">
                    No custom fields defined yet. Click "Add Field" below.
                  </div>
                )}

                {fields.map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id} index={index}>
                    {(provided, snapshot) => (
                      <Card 
                        className={`mb-2 border ${snapshot.isDragging ? 'shadow-lg border-primary' : 'shadow-sm'}`}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <Card.Body className="p-2 d-flex align-items-center">
                          <div 
                            {...provided.dragHandleProps} 
                            className="px-2 text-muted" 
                            style={{ cursor: 'grab' }}
                          >
                            <FaGripVertical />
                          </div>

                          <Row className="flex-grow-1 align-items-center g-2 m-0">
                            <Col md={7}>
                              <Form.Control 
                                type="text" 
                                placeholder="Field Name (e.g. Serial Number)" 
                                value={field.name}
                                onChange={(e) => updateField(index, 'name', e.target.value)}
                              />

                              <Form.Check 
                                type="switch"
                                id={`switch-${field.id}`}
                                label="Show in Items Table"
                                checked={field.showInTable !== false} // defaults to true
                                onChange={(e) => updateField(index, 'showInTable', e.target.checked)}
                                className="mt-2 text-muted small"
                              />
                            </Col>
                            <Col md={4}>
                              <Form.Select 
                                value={field.type} 
                                onChange={(e) => updateField(index, 'type', e.target.value)}
                              >
                                <option value="text">Text (Single-line)</option>
                                <option value="textarea">Text (Multi-line)</option>
                                <option value="number">Number</option>
                                <option value="link">Document/Image Link</option>
                                <option value="boolean">Yes/No (Boolean)</option>
                                <option value="date">Date</option>
                              </Form.Select>
                            </Col>
                            <Col md={1} className="text-end">
                              <Button variant="outline-danger" size="sm" onClick={() => deleteField(index)}>
                                <FaTrash />
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="mt-3">
          <Button variant="outline-primary" size="sm" onClick={addField}>
            <FaPlus className="me-2" /> Add Field
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CustomFieldsTab;