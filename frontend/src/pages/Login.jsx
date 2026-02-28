import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { FaGoogle, FaFacebook } from 'react-icons/fa';

const Login = () => {
  const BACKEND_URL = 'http://localhost:5000';

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
      <Card className="shadow-sm border-0" style={{ width: '100%', maxWidth: '400px' }}>
        <Card.Body className="p-5 text-center">
          <h2 className="fw-bold mb-3">Welcome Back</h2>
          <p className="text-muted mb-4">Sign in to manage your inventories and items.</p>
          
          <div className="d-grid gap-3">
            <Button 
              variant="outline-dark" 
              size="lg"
              className="d-flex align-items-center justify-content-center"
              onClick={() => window.location.href = `${BACKEND_URL}/api/auth/google`}
            >
              <FaGoogle className="me-2 text-danger" /> Continue with Google
            </Button>
            <Button 
              variant="primary" 
              size="lg"
              className="d-flex align-items-center justify-content-center"
              style={{ backgroundColor: '#1877F2', borderColor: '#1877F2' }}
              onClick={() => window.location.href = `${BACKEND_URL}/api/auth/facebook`}
            >
              <FaFacebook className="me-2" /> Continue with Facebook
            </Button>
          </div>


        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;