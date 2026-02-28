import React, { useState } from 'react';
import { Form, Button, ListGroup, Card, Spinner, Badge, InputGroup } from 'react-bootstrap';
import { FaUserPlus, FaUserMinus, FaShieldAlt } from 'react-icons/fa';
import api from '../../services/api';

const AccessTab = ({ inventory, onUpdate }) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    
    setIsSubmitting(true);
    try {

      const response = await api.post(`/inventories/${inventory.id}/access`, { email: emailInput });
      
    
      onUpdate(response.data.data);
      setEmailInput(''); 
    } catch (error) {
      console.error("Failed to grant access", error);
      alert(error.response?.data?.message || "User not found or error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeAccess = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to revoke write access for ${userName}?`)) return;

    try {

      const response = await api.delete(`/inventories/${inventory.id}/access`, {
        data: { userId: userId }
      });
      onUpdate(response.data.data);
    } catch (error) {
      console.error("Failed to revoke access", error);
      alert(error.response?.data?.message || "Failed to remove user.");
    }
  };

  return (
    <div className="p-2">
      <div className="mb-4">
        <h4 className="mb-1">Access Management</h4>
        <p className="text-muted small">Users listed here have full write access to add, edit, and delete items in this inventory.</p>
      </div>

      <Card className="border-0 shadow-sm mb-4 bg-light">
        <Card.Body>
          <Form onSubmit={handleGrantAccess}>
            <Form.Label className="fw-bold">Grant Write Access</Form.Label>
            <InputGroup>
              <Form.Control
                type="email"
                placeholder="Enter user's exact email address..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
              />
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Spinner animation="border" size="sm" /> : <><FaUserPlus className="me-2"/> Share</>}
              </Button>
            </InputGroup>
            <Form.Text className="text-muted">
              The user must already have an account on InventoryPro.
            </Form.Text>
          </Form>
        </Card.Body>
      </Card>

      <h5 className="mb-3">Current Access List</h5>
      <ListGroup variant="flush" className="border rounded shadow-sm">

        <ListGroup.Item className="d-flex justify-content-between align-items-center bg-white py-3">
          <div className="d-flex align-items-center">
            <FaShieldAlt className="text-primary me-3 fs-4" />
            <div>
              <p className="mb-0 fw-bold">{inventory.author?.name} <Badge bg="primary" className="ms-2">Owner</Badge></p>
              <small className="text-muted">{inventory.author?.email}</small>
            </div>
          </div>
        </ListGroup.Item>
        {inventory.accessList && inventory.accessList.length > 0 ? (
          inventory.accessList.map((sharedUser) => (
            <ListGroup.Item key={sharedUser.id} className="d-flex justify-content-between align-items-center bg-white py-3">
              <div className="d-flex align-items-center">
                <img 
                  src={sharedUser.avatar || 'https://via.placeholder.com/40'} 
                  alt="Avatar" 
                  className="rounded-circle me-3"
                  style={{ width: '32px', height: '32px' }}
                />
                <div>
                  <p className="mb-0 fw-bold">{sharedUser.name} <Badge bg="info" className="ms-2">Editor</Badge></p>
                  <small className="text-muted">{sharedUser.email}</small>
                </div>
              </div>
              <Button 
                variant="outline-danger" 
                size="sm" 
                onClick={() => handleRevokeAccess(sharedUser.id, sharedUser.name)}
                title="Revoke Access"
              >
                <FaUserMinus /> Remove
              </Button>
            </ListGroup.Item>
          ))
        ) : (
          <ListGroup.Item className="text-center py-4 text-muted bg-white">
            This inventory is private. You have not shared it with anyone.
          </ListGroup.Item>
        )}
      </ListGroup>
    </div>
  );
};

export default AccessTab;