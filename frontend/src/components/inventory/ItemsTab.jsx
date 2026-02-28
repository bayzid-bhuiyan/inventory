import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaHeart, FaRegHeart } from 'react-icons/fa';
import api from '../../services/api';

const ItemsTab = ({ inventory, hasWriteAccess, currentUser }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState(null);
  

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
 
  const [formData, setFormData] = useState({ name: '', quantity: 1, customFields: {} });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await api.get(`/items/inventory/${inventory.id}`);
      setItems(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch items", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [inventory.id]);

  const handleSelectRow = (id) => {
    setSelectedItemId(selectedItemId === id ? null : id); 
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ name: '', quantity: 1, customFields: {} });
    setShowModal(true);
  };

  const openEditModal = () => {
    const itemToEdit = items.find(i => i.id === selectedItemId);
    setModalMode('edit');
    setFormData({
      name: itemToEdit.name,
      quantity: itemToEdit.quantity,

      customFields: itemToEdit.customFields || {} 
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this item permanently?")) return;
    try {
      await api.delete(`/items/${selectedItemId}`);
      setSelectedItemId(null); 
      fetchItems(); 
    } catch (error) {
      alert("Failed to delete item.");
    }
  };
  const handleLike = async (e, itemId) => {
    e.stopPropagation(); 
    try {
      await api.post(`/likes/item/${itemId}/toggle`);
      fetchItems(); 
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Please log in to like items.");
      } else {
        alert("Failed to like item.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (modalMode === 'create') {
        await api.post(`/items/inventory/${inventory.id}`, formData);
      } else {
        await api.patch(`/items/${selectedItemId}`, formData);
      }
      setShowModal(false);
      setSelectedItemId(null);
      fetchItems();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save item.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleCustomFieldChange = (fieldId, value, type) => {
    let parsedValue = value;
    if (type === 'number') parsedValue = value === '' ? '' : Number(value);
    if (type === 'boolean') parsedValue = value === 'true';

    setFormData(prev => ({
      ...prev,
      customFields: { ...prev.customFields, [fieldId]: parsedValue }
    }));
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  const visibleCustomFields = inventory.customFieldDefs?.filter(f => f.showInTable) || [];

  return (
    <div className="p-2">
      {hasWriteAccess && (
        <div className="d-flex bg-light p-2 rounded border mb-3 shadow-sm align-items-center">
          <Button variant="success" size="sm" className="me-2" onClick={openCreateModal}>
            <FaPlus className="me-2" /> Add Item
          </Button>
          
          <div className="border-start ps-2 ms-2">
            <Button 
              variant="outline-primary" size="sm" className="me-2" 
              disabled={!selectedItemId} onClick={openEditModal}
            >
              <FaEdit className="me-1"/> Edit
            </Button>
            <Button 
              variant="outline-danger" size="sm" 
              disabled={!selectedItemId} onClick={handleDelete}
            >
              <FaTrash className="me-1"/> Delete
            </Button>
          </div>
          <span className="ms-auto text-muted small">
            {selectedItemId ? "1 item selected" : "Select an item to edit or delete"}
          </span>
        </div>
      )}
      <div className="table-responsive border rounded shadow-sm">
        <Table hover className="mb-0 align-middle">
          <thead className="table-dark">
            <tr>
              {hasWriteAccess && <th style={{ width: '40px' }}></th>}
              <th>ID</th>
              <th>Name</th>
              <th>Qty</th>
              {visibleCustomFields.map(field => (
                <th key={field.id}>{field.name}</th>
              ))}
              <th>Likes</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-4 text-muted">No items in this inventory yet.</td>
              </tr>
            ) : (
              items.map(item => {
                const hasLiked = currentUser && item.likes?.some(l => l.userId === currentUser.id);
                
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => hasWriteAccess && handleSelectRow(item.id)}
                    className={selectedItemId === item.id ? 'table-primary' : ''}
                    style={{ cursor: hasWriteAccess ? 'pointer' : 'default' }}
                  >
                    {hasWriteAccess && (
                      <td>
                        <Form.Check 
                          type="radio" 
                          checked={selectedItemId === item.id} 
                          onChange={() => handleSelectRow(item.id)} 
                        />
                      </td>
                    )}
                    <td><Badge bg="secondary">{item.customId}</Badge></td>
                    <td className="fw-bold">{item.name}</td>
                    <td>{item.quantity}</td>
                    {visibleCustomFields.map(field => {
                      let value = item.customFields?.[field.id];
                      if (field.type === 'boolean') value = value ? 'Yes' : 'No';
                      else if (field.type === 'link' && value) value = <a href={value} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Link</a>;
                      
                      return (
                        <td key={field.id}>
                          {value !== undefined && value !== null ? value : '-'}
                        </td>
                      );
                    })}

                    <td>
                      <Button variant="link" className="p-0 text-decoration-none text-danger" onClick={(e) => handleLike(e, item.id)}>
                        {hasLiked ? <FaHeart /> : <FaRegHeart />} <span className="text-dark ms-1">{item.likes?.length || 0}</span>
                      </Button>
                    </td>

                    <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'create' ? 'Add New Item' : 'Edit Item'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Item Name</Form.Label>
                  <Form.Control 
                    required type="text" value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control 
                    required type="number" min="1" value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  />
                </Form.Group>
              </Col>
            </Row>
            {inventory.customFieldDefs?.length > 0 && <hr />}
            <Row>
              {inventory.customFieldDefs?.map(field => {
                const value = formData.customFields[field.id];

                return (
                  <Col md={6} key={field.id}>
                    <Form.Group className="mb-3">
                      <Form.Label>{field.name} <small className="text-muted">({field.type})</small></Form.Label>
                      
                      {field.type === 'boolean' ? (
                        <Form.Select
                          value={value?.toString() || 'false'}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.type)}
                        >
                          <option value="false">No / False</option>
                          <option value="true">Yes / True</option>
                        </Form.Select>
                      ) : field.type === 'textarea' ? (
                        <Form.Control 
                          as="textarea" rows={2}
                          value={value || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.type)}
                        />
                      ) : field.type === 'link' ? (
                        <Form.Control 
                          type="url" placeholder="https://..."
                          value={value || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.type)}
                        />
                      ) : (
                        <Form.Control 
                          type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                          value={value || ''}
                          onChange={(e) => handleCustomFieldChange(field.id, e.target.value, field.type)}
                        />
                      )}
                    </Form.Group>
                  </Col>
                );
              })}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default ItemsTab;