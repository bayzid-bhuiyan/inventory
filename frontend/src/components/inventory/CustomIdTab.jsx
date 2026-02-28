import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Badge, Alert, ListGroup } from 'react-bootstrap';
import { FaSave, FaEye, FaGripVertical, FaTimes, FaPlus, FaCogs } from 'react-icons/fa';
import api from '../../services/api';

const CustomIdTab = ({ inventory, onUpdate }) => {
  const [blocks, setBlocks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [draggedIdx, setDraggedIdx] = useState(null);

  useEffect(() => {
    if (inventory?.customIdFormat && Array.isArray(inventory.customIdFormat)) {
      setBlocks(inventory.customIdFormat);
    } else if (inventory?.customIdFormat?.prefix) {
      setBlocks([
        { id: '1', type: 'FIXED', value: inventory.customIdFormat.prefix + '-' },
        { id: '2', type: 'SEQUENCE' }
      ]);
    } else {
      setBlocks([
        { id: 'init1', type: 'FIXED', value: 'ITEM-' }, 
        { id: 'init2', type: 'SEQUENCE' }
      ]);
    }
  }, [inventory]);

  const addBlock = (type) => {
    setBlocks([...blocks, { id: Date.now().toString(), type, value: type === 'FIXED' ? '-' : '' }]);
  };

  const removeBlock = (index) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlockValue = (index, val) => {
    const newBlocks = [...blocks];
    newBlocks[index].value = val;
    setBlocks(newBlocks);
  };
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    
    const newBlocks = [...blocks];
    const draggedItem = newBlocks[draggedIdx];
    
    newBlocks.splice(draggedIdx, 1); 
    newBlocks.splice(targetIdx, 0, draggedItem); 
    
    setBlocks(newBlocks);
    setDraggedIdx(null);
  };

  const generatePreview = () => {
    if (blocks.length === 0) return "EMPTY-FORMAT";
    return blocks.map(block => {
      switch (block.type) {
        case 'FIXED': return block.value || '';
        case 'SEQUENCE': return '001';
        case 'RANDOM_20': return 'A4F9C'; 
        case 'RANDOM_32': return 'B83D19F2'; 
        case 'GUID': return '123e4567-e89b-12d3-a456-426614174000';
        case 'DATE': return new Date().toISOString().slice(0, 10).replace(/-/g, '');
        default: return '';
      }
    }).join('');
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      const formatData = {
        version: inventory.version,
        customIdFormat: blocks 
      };

      const response = await api.patch(`/inventories/${inventory.id}`, formatData);
      
      onUpdate({ 
        customIdFormat: response.data.data.customIdFormat,
        version: response.data.data.version 
      });
      
      setSuccessMsg('Custom ID Blocks saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-3">
      <h4 className="mb-4 text-secondary"><FaCogs className="me-2" /> Drag & Drop ID Builder</h4>
      
      <Row>
        <Col md={7}>
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white pt-3 border-bottom-0">
              <h5 className="mb-0">Format Blocks</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-4 p-3 bg-light rounded border">
                <p className="small text-muted mb-2 fw-bold text-uppercase">1. Click to add blocks</p>
                <div className="d-flex flex-wrap gap-2">
                  <Button variant="outline-primary" size="sm" onClick={() => addBlock('FIXED')}><FaPlus className="me-1"/> Fixed Text</Button>
                  <Button variant="outline-success" size="sm" onClick={() => addBlock('SEQUENCE')}><FaPlus className="me-1"/> Sequence</Button>
                  <Button variant="outline-info" size="sm" onClick={() => addBlock('DATE')}><FaPlus className="me-1"/> Date</Button>
                  <Button variant="outline-warning" size="sm" onClick={() => addBlock('RANDOM_20')}><FaPlus className="me-1"/> 20-bit Hash</Button>
                  <Button variant="outline-danger" size="sm" onClick={() => addBlock('RANDOM_32')}><FaPlus className="me-1"/> 32-bit Hash</Button>
                  <Button variant="outline-dark" size="sm" onClick={() => addBlock('GUID')}><FaPlus className="me-1"/> GUID</Button>
                </div>
              </div>
              <p className="small text-muted mb-2 fw-bold text-uppercase">2. Drag handles (⋮⋮) to reorder</p>
              <ListGroup className="mb-3">
                {blocks.length === 0 && <Alert variant="secondary">No blocks added.</Alert>}
                
                {blocks.map((block, index) => (
                  <ListGroup.Item 
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className="d-flex align-items-center shadow-sm mb-2 rounded border"
                    style={{ cursor: 'grab', opacity: draggedIdx === index ? 0.5 : 1 }}
                  >
                    <FaGripVertical className="text-muted me-3" />
                    
                    <Badge bg="secondary" className="me-3 p-2" style={{ width: '120px' }}>
                      {block.type.replace('_', ' ')}
                    </Badge>

                    <div className="flex-grow-1 me-3">
                      {block.type === 'FIXED' ? (
                        <Form.Control 
                          size="sm" 
                          type="text" 
                          placeholder="Text or Hyphen (e.g., -)" 
                          value={block.value}
                          onChange={(e) => updateBlockValue(index, e.target.value)}
                        />
                      ) : (
                        <small className="text-muted">Auto-generated by server</small>
                      )}
                    </div>

                    <Button variant="link" className="text-danger p-0" onClick={() => removeBlock(index)}>
                      <FaTimes />
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>

            </Card.Body>
          </Card>
        </Col>
        <Col md={5}>
          <Card className="shadow-sm border-0 text-center sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-dark text-white pt-3">
              <h5 className="mb-0"><FaEye className="me-2" /> Live Preview</h5>
            </Card.Header>
            <Card.Body className="p-5">
              <p className="text-muted mb-2">Items will be assigned IDs like this:</p>
              
              <div className="p-3 border border-2 border-primary rounded bg-light mb-4 text-break">
                <h4 className="mb-0 text-primary fw-bold font-monospace">
                  {generatePreview()}
                </h4>
              </div>

              {successMsg && <Alert variant="success" className="py-2">{successMsg}</Alert>}

              <Button 
                variant="primary" 
                size="lg" 
                className="w-100 shadow-sm"
                onClick={handleSave}
                disabled={isSubmitting || blocks.length === 0}
              >
                {isSubmitting ? 'Saving...' : <><FaSave className="me-2" /> Save Builder Format</>}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomIdTab;