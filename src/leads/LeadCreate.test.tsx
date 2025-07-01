import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadCreate from './LeadCreate';
import { DataProviderContext, AdminContext } from 'react-admin';

const dataProvider = {
  create: jest.fn().mockResolvedValue({ data: { id: 3, name: 'New Lead' } }),
};

describe('LeadCreate', () => {
  it('renders form and submits new lead', async () => {
    render(
      <AdminContext>
        <DataProviderContext.Provider value={dataProvider as any}>
          <LeadCreate />
        </DataProviderContext.Provider>
      </AdminContext>
    );
    // Fill in form fields (adjust selectors as needed)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'New Lead' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'newlead@example.com' } });
    fireEvent.click(screen.getByText(/save/i));
    // Check that dataProvider.create was called
    expect(dataProvider.create).toHaveBeenCalled();
  });
}); 