import React from 'react';
import { render, screen } from '@testing-library/react';
import LeadKanbanBoard from './LeadKanbanBoard';

const leads = [
  { id: 1, name: 'John Doe', status: 'New' },
  { id: 2, name: 'Jane Smith', status: 'Contacted' },
];

describe('LeadKanbanBoard', () => {
  it('renders kanban columns and cards', () => {
    render(<LeadKanbanBoard leads={leads} refetch={jest.fn()} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    // Add more assertions for columns if needed
  });
  // Drag-and-drop simulation can be added with fireEvent or user-event if needed
}); 