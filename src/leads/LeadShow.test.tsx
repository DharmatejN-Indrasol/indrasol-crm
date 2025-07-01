import React from 'react';
import { render, screen } from '@testing-library/react';
import LeadShow from './LeadShow';
import { RecordContextProvider } from 'react-admin';

const lead = { id: 1, name: 'John Doe', email: 'john@example.com', status: 'New', owner_id: 'Manager', created_at: '2024-08-01' };

describe('LeadShow', () => {
  it('renders lead detail info', () => {
    render(
      <RecordContextProvider value={lead}>
        <LeadShow />
      </RecordContextProvider>
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });
}); 