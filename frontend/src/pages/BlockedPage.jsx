import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { FaBan } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const BlockedPage = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center mt-5" style={{ minHeight: '60vh' }}>
      <Card className="text-center shadow-lg p-5 border-0 rounded-4" style={{ maxWidth: '500px' }}>
        <FaBan className="text-danger mx-auto mb-4" size={80} />
        <h2 className="mb-3 text-danger fw-bold">Access Denied</h2>
        <p className="text-muted mb-4 fs-5">
          Your account has been blocked by an administrator. You no longer have permission to log in or interact with this platform.
        </p>
        <Button as={Link} to="/" variant="outline-secondary">
          Return to Home (Read-Only)
        </Button>
      </Card>
    </Container>
  );
};

export default BlockedPage;