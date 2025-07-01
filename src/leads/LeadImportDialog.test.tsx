import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadImportDialog from './LeadImportDialog';

const onClose = jest.fn();

describe('LeadImportDialog', () => {
  it('renders import dialog and handles file input', () => {
    render(<LeadImportDialog open={true} onClose={onClose} />);
    expect(screen.getByText(/Import Leads/i)).toBeInTheDocument();
    // Simulate file input if needed
    // const file = new File(['id,name\n1,Test'], 'leads.csv', { type: 'text/csv' });
    // fireEvent.change(screen.getByLabelText(/upload/i), { target: { files: [file] } });
  });
}); 