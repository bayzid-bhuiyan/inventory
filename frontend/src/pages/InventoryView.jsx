import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Tabs, Tab, Button } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { FaArrowLeft } from 'react-icons/fa';

import SettingsTab from '../components/inventory/SettingsTab';
import CustomFieldsTab from '../components/inventory/CustomFieldsTab';
import AccessTab from '../components/inventory/AccessTab';
import ItemsTab from '../components/inventory/ItemsTab';
import DiscussionTab from '../components/inventory/DiscussionTab';
import StatisticsTab from '../components/inventory/StatisticsTab'; 
import CustomIdTab from '../components/inventory/CustomIdTab';

const InventoryView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInventory = async () => {
    try {
      const response = await api.get(`/inventories/${id}`);
      setInventory(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [id]);

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
  if (!inventory) return null;

  const isAuthor = Boolean(user && user.id === inventory.authorId);
  const isAdmin = Boolean(user && user.isAdmin);
  const isShared = Boolean(user && inventory.accessList?.some(u => u.id === user.id));
  const hasWriteAccess = Boolean(isAuthor || isAdmin || isShared);

  return (
    <Container className="mt-4">
      <Button variant="link" className="text-decoration-none p-0 mb-3" onClick={() => navigate(-1)}>
        <FaArrowLeft className="me-2" /> Back
      </Button>

      <div className="d-flex align-items-center mb-4">
        {inventory.imageUrl && (
          <img 
            src={inventory.imageUrl} 
            alt="Cover" 
            className="rounded me-4 shadow-sm"
            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
          />
        )}
        <div>
          <h2 className="mb-1">{inventory.title}</h2>
          <span className="badge bg-secondary me-2">{inventory.category}</span>
          <span className="text-muted">Created by {inventory.author?.name}</span>
        </div>
      </div>

      <div className="bg-white rounded shadow-sm p-3 border">
        <Tabs defaultActiveKey="items" id="inventory-tabs" className="mb-3">
          
          <Tab eventKey="items" title="ITEMS">
            <ItemsTab inventory={inventory} hasWriteAccess={hasWriteAccess} currentUser={user} />
          </Tab>

    
          <Tab eventKey="statistics" title="STATISTICS">
            <StatisticsTab inventory={inventory} />
          </Tab>
          
          <Tab eventKey="discussion" title=" DISCUSSIONS">
            <DiscussionTab inventory={inventory} />
          </Tab>
          {hasWriteAccess && (
            <Tab eventKey="fields" title="CUSTOM FIELDS">
              <CustomFieldsTab 
                inventory={inventory} 
                onUpdate={(updatedData) => setInventory({ ...inventory, ...updatedData })} 
              />
            </Tab>
          )}

          {hasWriteAccess && (
            <Tab eventKey="custom-id" title="CUSTOM IDS">
              <CustomIdTab 
                inventory={inventory} 
                onUpdate={(updatedData) => setInventory({ ...inventory, ...updatedData })} 
              />
            </Tab>
          )}

          {hasWriteAccess && (
            <Tab eventKey="settings" title="SETTINGS">
              <SettingsTab 
                inventory={inventory} 
                onUpdate={(updatedData) => setInventory({ ...inventory, ...updatedData })} 
              />
            </Tab>
          )}

          {isAuthor && (
            <Tab eventKey="access" title="ACCESS CONTROLS">
              <AccessTab 
                inventory={inventory} 
                onUpdate={(updatedData) => setInventory({ ...inventory, ...updatedData })} 
              />
            </Tab>
          )}

        </Tabs>
      </div>
    </Container>
  );
};

export default InventoryView;