import React, { useState, useEffect, useContext } from 'react';
import { Container, Card, Tabs, Tab, Button, Modal, Form, Table, Badge, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';

const Personal = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [myInventories, setMyInventories] = useState([]);
  const [sharedInventories, setSharedInventories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Equipment',
    image: null
  });

  const [selectedId, setSelectedId] = useState(null);
  const [selectedSharedId, setSelectedSharedId] = useState(null);
  const fetchAllInventories = async () => {
    if (!user) return;
    try {
      const [ownedRes, sharedRes] = await Promise.all([
        api.get(`/inventories?authorId=${user.id}`),
        api.get('/inventories/shared')
      ]);
      
      setMyInventories(ownedRes.data.data || []);
      setSharedInventories(sharedRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch inventories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllInventories();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setFormData({ ...formData, image: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleCreateInventory = async (e) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    if (formData.image) {
      submitData.append('image', formData.image);
    }

    try {
      await api.post('/inventories', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      setFormData({ title: '', description: '', category: 'Equipment', image: null });
      fetchAllInventories();
    } catch (error) {
      console.error("Failed to create inventory", error);
      alert(error.response?.data?.message || "Error creating inventory");
    }
  };

  const handleSelectRow = (id) => {
    setSelectedId(selectedId === id ? null : id);
  };

  const handleSelectSharedRow = (id) => {
    setSelectedSharedId(selectedSharedId === id ? null : id);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this inventory permanently?")) return;
    try {
      await api.delete(`/inventories/${selectedId}`);
      setSelectedId(null);
      fetchAllInventories(); 
    } catch (error) {
      alert("Failed to delete inventory.");
    }
  };

  if (!user) return <Container className="mt-5 text-center"><h2>Please login to view this page.</h2></Container>;

  return (
    <Container className="mt-4">
      <Card className="mb-4 shadow-sm border-0 bg-primary text-white">
        <Card.Body className="d-flex align-items-center">
          <img 
            src={user.avatar || 'https://via.placeholder.com/80'} 
            alt="Profile" 
            className="rounded-circle me-4 border border-light border-3"
            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
          />
          <div>
            <h2 className="mb-1">{user.name}</h2>
            <p className="mb-0 text-white-50">{user.email}</p>
            {user.isAdmin && <Badge bg="danger" className="mt-2">Administrator</Badge>}
          </div>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Inventory Dashboard</h3>
        <Button variant="success" onClick={() => setShowModal(true)}>
          <FaPlus className="me-2" /> Create New
        </Button>
      </div>

      <Tabs defaultActiveKey="owned" id="personal-tabs" className="mb-4 shadow-sm rounded">
        <Tab eventKey="owned" title="Owned Inventories" className="bg-white p-3 border border-top-0 rounded-bottom">
          <div className="d-flex bg-light p-2 rounded border mb-3 shadow-sm align-items-center">
            <span className="me-auto text-muted small ps-2">
              {selectedId ? "1 inventory selected" : "Select an inventory to manage"}
            </span>
            
            <div className="border-start ps-3">
              <Button 
                variant="outline-primary" size="sm" className="me-2"
                disabled={!selectedId} onClick={() => navigate(`/inventory/${selectedId}`)}
              >
                <FaEye className="me-1" /> View/Manage
              </Button>
              <Button 
                variant="outline-danger" size="sm" 
                disabled={!selectedId} onClick={handleDelete}
              >
                <FaTrash className="me-1" /> Delete
              </Button>
            </div>
          </div>

          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Items Count</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myInventories.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-5 text-muted">You haven't created any inventories yet.</td></tr>
                    ) : (
                      myInventories.map(inv => (
                        <tr 
                          key={`owned-${inv.id}`} 
                          onClick={() => handleSelectRow(inv.id)}
                          className={selectedId === inv.id ? 'table-primary' : ''}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <Form.Check 
                              type="radio" 
                              checked={selectedId === inv.id} 
                              onChange={() => handleSelectRow(inv.id)} 
                            />
                          </td>
                          <td className="fw-bold">{inv.title}</td>
                          <td><Badge bg="secondary">{inv.category}</Badge></td>
                          <td>{inv.items?.length || 0} items</td>
                          <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="shared" title="Shared With Me" className="bg-white p-3 border border-top-0 rounded-bottom">
          <div className="d-flex bg-light p-2 rounded border mb-3 shadow-sm align-items-center">
            <span className="me-auto text-muted small ps-2">
              {selectedSharedId ? "1 shared inventory selected" : "Select an inventory to view"}
            </span>
            
            <div className="border-start ps-3">
              <Button 
                variant="outline-primary" size="sm"
                disabled={!selectedSharedId} onClick={() => navigate(`/inventory/${selectedSharedId}`)}
              >
                <FaEye className="me-1" /> View Inventory
              </Button>
            </div>
          </div>

          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5"><Spinner animation="border" /></div>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Owner</th>
                      <th>Items Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sharedInventories.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <h5>No inventories have been shared with you yet.</h5>
                        </td>
                      </tr>
                    ) : (
                      sharedInventories.map(inv => (
                        <tr 
                          key={`shared-${inv.id}`} 
                          onClick={() => handleSelectSharedRow(inv.id)}
                          className={selectedSharedId === inv.id ? 'table-primary' : ''}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <Form.Check 
                              type="radio" 
                              checked={selectedSharedId === inv.id} 
                              onChange={() => handleSelectSharedRow(inv.id)} 
                            />
                          </td>
                          <td className="fw-bold">{inv.title}</td>
                          <td><Badge bg="info">{inv.category}</Badge></td>
                          <td>{inv.author?.name || 'Unknown'}</td>
                          <td>{inv.items?.length || 0} items</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Create New Inventory</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateInventory}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control 
                type="text" name="title" required 
                value={formData.title} onChange={handleInputChange} 
                placeholder="e.g., Main Office Electronics" 
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Select name="category" value={formData.category} onChange={handleInputChange}>
                <option value="Equipment">Equipment</option>
                <option value="Furniture">Furniture</option>
                <option value="Book">Book</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" rows={3} name="description" 
                value={formData.description} onChange={handleInputChange} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cover Image (Optional)</Form.Label>
              <Form.Control type="file" name="image" accept="image/*" onChange={handleInputChange} />
              <Form.Text className="text-muted">Image will be uploaded to Cloudinary securely.</Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Inventory</Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </Container>
  );
};

export default Personal;