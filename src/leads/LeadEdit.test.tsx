import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeadEdit from './LeadEdit';
import { DataProviderContext, AdminContext } from 'react-admin';

const dataProvider = {
  update: jest.fn().mockResolvedValue({ data: { id: 1, name: 'John Doe Updated' } }),
};

describe('LeadEdit', () => {
  it('renders edit form and submits changes', async () => {
    render(
      <AdminContext>
        <DataProviderContext.Provider value={dataProvider as any}>
          <LeadEdit />
        </DataProviderContext.Provider>
      </AdminContext>
    );
    // Fill in form fields (adjust selectors as needed)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe Updated' } });
    fireEvent.click(screen.getByText(/save/i));
    expect(dataProvider.update).toHaveBeenCalled();
  });
}); 