import { renderHook, act } from '@testing-library/react-hooks';
import { useContactImport, ContactImportSchema } from './useContactImport';
import { TestContext } from 'react-admin';
import React from 'react';

describe('useContactImport', () => {
  const mockCreate = jest.fn();
  const mockGetList = jest.fn();
  const mockDataProvider = {
    getList: mockGetList,
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyReference: jest.fn(),
    create: mockCreate,
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  };
  const mockIdentity = { id: 1, fullName: 'Test User', avatar: '', email: 'test@example.com' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetList.mockResolvedValue({ data: [], total: 0 });
    mockCreate.mockImplementation(async (_resource, { data }) => ({ data }));
  });

  it('imports a batch of contacts, creating companies and tags as needed', async () => {
    const wrapper = ({ children }) => (
      <TestContext dataProvider={mockDataProvider as any} identity={mockIdentity}>
        {children}
      </TestContext>
    );
    const { result } = renderHook(() => useContactImport(), { wrapper });

    const batch: ContactImportSchema[] = [
      {
        first_name: 'Alice',
        last_name: 'Smith',
        company_name: 'Acme Corp',
        email_work: 'alice@acme.com',
        tags: 'VIP,Test',
      },
      {
        first_name: 'Bob',
        last_name: 'Jones',
        company_name: 'Beta Inc',
        email_work: 'bob@beta.com',
        tags: 'Test',
      },
    ];

    await act(async () => {
      await result.current(batch);
    });

    // Should create companies and tags, then contacts
    expect(mockCreate).toHaveBeenCalledWith('companies', expect.objectContaining({ data: expect.objectContaining({ name: 'Acme Corp' }) }));
    expect(mockCreate).toHaveBeenCalledWith('companies', expect.objectContaining({ data: expect.objectContaining({ name: 'Beta Inc' }) }));
    expect(mockCreate).toHaveBeenCalledWith('tags', expect.objectContaining({ data: expect.objectContaining({ name: 'VIP' }) }));
    expect(mockCreate).toHaveBeenCalledWith('tags', expect.objectContaining({ data: expect.objectContaining({ name: 'Test' }) }));
    expect(mockCreate).toHaveBeenCalledWith('contacts', expect.objectContaining({ data: expect.objectContaining({ first_name: 'Alice', last_name: 'Smith' }) }));
    expect(mockCreate).toHaveBeenCalledWith('contacts', expect.objectContaining({ data: expect.objectContaining({ first_name: 'Bob', last_name: 'Jones' }) }));
  });
}); 