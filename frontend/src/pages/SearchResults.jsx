import React, { useState, useEffect } from 'react';
import { Container, Table, Badge, Spinner, Alert, Card } from 'react-bootstrap';
import { useLocation, Link } from 'react-router-dom';
import { FaSearch, FaTags } from 'react-icons/fa';
import api from '../services/api';

const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Extract parameters from URL
  const query = searchParams.get('q');
  const tag = searchParams.get('tag');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        if (query) {
          const response = await api.get(`/inventories?search=${query}`);
          setResults(response.data.data || []);
        } else if (tag) {
          const response = await api.get('/inventories');
          const allInventories = response.data.data || [];
          const filtered = allInventories.filter(inv => 
            inv.tags?.some(t => t.name.toLowerCase() === tag.toLowerCase())
          );
          setResults(filtered);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
  }, [query, tag]);

  if (loading) return <Container className="text-center mt-5"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="mt-4">
      <div className="d-flex align-items-center mb-4">
        {query ? (
          <h3 className="mb-0"><FaSearch className="me-2 text-primary" /> Search Results for: <strong>"{query}"</strong></h3>
        ) : tag ? (
          <h3 className="mb-0"><FaTags className="me-2 text-info" /> Inventories tagged: <strong>{tag}</strong></h3>
        ) : (
          <h3 className="mb-0">No Search Parameters Provided</h3>
        )}
      </div>

      {results.length === 0 ? (
        <Alert variant="warning" className="shadow-sm">No inventories found matching your criteria.</Alert>
      ) : (
        <Card className="shadow-sm border-0">
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Tags</th>
                  <th>Author</th>
                </tr>
              </thead>
              <tbody>
                {results.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/inventory/${inv.id}`} className="fw-bold text-decoration-none text-primary">
                        {inv.title}
                      </Link>
                      <div className="small text-muted text-truncate mt-1" style={{ maxWidth: '400px' }}>
                        {inv.description}
                      </div>
                    </td>
                    <td><Badge bg="secondary">{inv.category}</Badge></td>
                    <td>
                      {inv.tags?.map(t => (
                        <Badge bg={t.name.toLowerCase() === tag?.toLowerCase() ? "warning" : "info"} text={t.name.toLowerCase() === tag?.toLowerCase() ? "dark" : "light"} className="me-1" key={t.id || t.name}>
                          {t.name}
                        </Badge>
                      ))}
                    </td>
                    <td>{inv.authorName || inv.author?.name}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default SearchResults;