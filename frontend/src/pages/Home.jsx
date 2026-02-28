import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Badge, Spinner, Card, Alert, Button } from 'react-bootstrap';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagData, setTagData] = useState([]);
  const [topInventories, setTopInventories] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const isBlocked = searchParams.get('blocked') === 'true';

  const dismissAlert = () => {
    searchParams.delete('blocked');
    setSearchParams(searchParams);
  };

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        const response = await api.get('/inventories');
        const data = response.data.data || [];
        setInventories(data);

        const sortedByPopularity = [...data].sort((a, b) => (b._count?.items || 0) - (a._count?.items || 0));
        const top5 = sortedByPopularity.slice(0, 5);
        setTopInventories(top5);

        const tagCounts = {};
        data.forEach(inv => {
          inv.tags?.forEach(tag => {
            tagCounts[tag.name] = (tagCounts[tag.name] || 0) + 1;
          });
        });

        const formattedTags = Object.keys(tagCounts)
          .map(key => ({
            value: key,
            count: tagCounts[key]
          }))
          .sort((a, b) => a.value.localeCompare(b.value));
        
        setTagData(formattedTags);
      } catch (error) {
        console.error("Failed to fetch inventories", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventories();
  }, []);

  const handleTagClick = (tagValue) => {
    navigate(`/search?tag=${encodeURIComponent(tagValue)}`);
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {isBlocked && (
        <Alert variant="danger" onClose={dismissAlert} dismissible className="shadow-sm rounded-3 mb-4">
          <Alert.Heading className="fw-bold">🚫 Account Suspended</Alert.Heading>
          <p className="mb-0">Your session was terminated because your account has been blocked.</p>
        </Alert>
      )}

      <Row>
        <Col lg={9}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0 text-uppercase">🌍 Latest Inventories</h2>
          </div>

          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Tags</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {inventories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-5 text-muted">
                        No inventories found.
                      </td>
                    </tr>
                  ) : (
                    inventories.slice(0, 10).map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <Link to={`/inventory/${inv.id}`} className="text-decoration-none fw-bold text-primary">
                            {inv.title}
                          </Link>
                        </td>
                        <td><Badge bg="secondary">{inv.category}</Badge></td>
                        <td>{inv.author?.name}</td>
                        <td>
                          {inv.tags?.slice(0, 3).map(tag => (
                            <Badge 
                              bg="info" 
                              className="me-1" 
                              key={tag.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleTagClick(tag.name)}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {(inv.tags?.length || 0) > 3 && <span className="text-muted text-sm">+{inv.tags.length - 3}</span>}
                        </td>
                        <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <h2 className="mb-4 mt-5 text-uppercase">⭐ Top 5 Popular Inventories</h2>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Title</th>
                    <th>Items Count</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {topInventories.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-5 text-muted">
                        No items have been added to any inventories yet.
                      </td>
                    </tr>
                  ) : (
                    topInventories.map(inv => (
                      <tr key={`top-${inv.id}`}>
                        <td>
                          <Link to={`/inventory/${inv.id}`} className="text-decoration-none fw-bold text-primary">
                            {inv.title}
                          </Link>
                        </td>

                        <td><Badge bg="success" className="p-2 fs-6">{inv._count?.items || 0} items</Badge></td>
                        <td>{inv.category}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} className="mt-4 mt-lg-0">
          <Card className="shadow-sm border-0 sticky-top" style={{ top: '20px' }}>
            <Card.Header className="bg-primary text-white fw-bold py-3 text-center">
              🏷️ Popular Tags
            </Card.Header>
            <Card.Body className="p-4">
              {tagData.length > 0 ? (
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {tagData.map((tag) => (
                    <Button
                      key={tag.value}
                      variant="outline-primary"
                      size="sm"
                      className="rounded-pill fw-bold shadow-sm d-flex align-items-center"
                      onClick={() => handleTagClick(tag.value)}
                    >
                      {tag.value}
                      <Badge bg="primary" className="ms-2 rounded-pill">
                        {tag.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center mb-0">No tags yet.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;