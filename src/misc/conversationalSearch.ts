export async function mockConversationalSearch(query: string) {
  // Simple mock: return different results based on keywords
  const lower = query.toLowerCase();
  if (lower.includes('deal')) {
    return [
      { title: 'Acme Corp - Won Deal', type: 'Deal', url: '/deals/1/show' },
      { title: 'Beta Inc - Pending Deal', type: 'Deal', url: '/deals/2/show' },
    ];
  }
  if (lower.includes('contact') || lower.includes('lead')) {
    return [
      { title: 'Jane Doe', type: 'Contact', url: '/contacts/1/show' },
      { title: 'John Smith', type: 'Contact', url: '/contacts/2/show' },
    ];
  }
  if (lower.includes('company')) {
    return [
      { title: 'Acme Corp', type: 'Company', url: '/companies/1/show' },
      { title: 'Beta Inc', type: 'Company', url: '/companies/2/show' },
    ];
  }
  if (lower.includes('note')) {
    return [
      { title: 'Follow-up with Jane', type: 'Note', url: '/contacts/1/show#notes' },
      { title: 'Meeting summary', type: 'Note', url: '/companies/1/show#notes' },
    ];
  }
  // Default: no results
  return [];
} 