import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import { FaBoxOpen, FaCubes, FaHeart, FaTags, FaChartLine } from 'react-icons/fa';
import api from '../../services/api';

const StatisticsTab = ({ inventory }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get(`/items/inventory/${inventory.id}`);
        setItems(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch items for stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [inventory.id]);

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;

  if (items.length === 0) {
    return (
      <div className="text-center p-5 text-muted">
        <FaChartLine size={40} className="mb-3 opacity-50" />
        <h5>No data available yet</h5>
        <p>Add some items to this inventory to see statistics and insights.</p>
      </div>
    );
  }

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalLikes = items.reduce((sum, item) => sum + (item.likes?.length || 0), 0);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentItemsCount = items.filter(item => new Date(item.createdAt) > oneWeekAgo).length;
  const recentPercentage = Math.round((recentItemsCount / totalItems) * 100);
  const inventoryTags = Array.isArray(inventory.tags) ? inventory.tags : [];

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0 text-secondary"><FaChartLine className="me-2" /> Inventory Insights</h4>
      </div>
      {inventoryTags.length > 0 && (
        <div className="mb-4 bg-light p-3 rounded border shadow-sm">
          <span className="text-muted small text-uppercase fw-bold me-2"><FaTags className="me-1"/> Inventory Tags:</span>
          {inventoryTags.map((tag, idx) => (
            <Badge bg="primary" key={idx} className="me-2 p-2 fs-6">
              {tag.name || tag}
            </Badge>
          ))}
        </div>
      )}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <Card className="shadow-sm border-0 bg-primary text-white h-100">
            <Card.Body className="d-flex align-items-center">
              <FaBoxOpen size={40} className="me-3 opacity-75" />
              <div>
                <h6 className="mb-0 text-uppercase fw-bold opacity-75">Unique Items</h6>
                <h2 className="mb-0 fw-bold">{totalItems}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 bg-success text-white h-100">
            <Card.Body className="d-flex align-items-center">
              <FaCubes size={40} className="me-3 opacity-75" />
              <div>
                <h6 className="mb-0 text-uppercase fw-bold opacity-75">Total Quantity</h6>
                <h2 className="mb-0 fw-bold">{totalQuantity}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow-sm border-0 bg-danger text-white h-100">
            <Card.Body className="d-flex align-items-center">
              <FaHeart size={40} className="me-3 opacity-75" />
              <div>
                <h6 className="mb-0 text-uppercase fw-bold opacity-75">Total Likes</h6>
                <h2 className="mb-0 fw-bold">{totalLikes}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={8} className="mx-auto">
          <Card className="shadow-sm border-0 h-100">
            <Card.Header className="bg-white border-bottom-0 pt-3">
              <h5 className="mb-0">Recent Activity (Last 7 Days)</h5>
            </Card.Header>
            <Card.Body>
              <h1 className="display-4 fw-bold text-primary mb-0">{recentItemsCount}</h1>
              <p className="text-muted mb-4">New items added recently</p>
              
              <div className="mb-1 d-flex justify-content-between">
                <small className="fw-bold">Inventory Growth</small>
                <small>{recentPercentage}% of total</small>
              </div>
              <ProgressBar 
                now={recentPercentage} 
                variant="primary" 
                style={{ height: '10px' }} 
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsTab;