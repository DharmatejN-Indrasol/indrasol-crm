// Centralized mock AI logic for summary, sentiment, and next action

export function getNoteSummaryAndSentiment(note: any) {
  // Mock: Use note text length for sentiment
  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (note.text && note.text.length > 100) sentiment = 'positive';
  else if (note.text && note.text.length < 30) sentiment = 'negative';
  // Mock: Use first 12 words as summary
  const summary = note.text ? note.text.split(' ').slice(0, 12).join(' ') + (note.text.split(' ').length > 12 ? '...' : '') : '';
  return { summary, sentiment };
}

export function getAINextAction(context: any) {
  // Mock: Suggest follow up for deals/notes, validate for contacts/companies
  if (context.type === 'deal' || context.type === 'note') {
    return 'AI: Next best action: Follow up with client.';
  }
  if (context.type === 'contact') {
    return 'AI: Next best action: Validate email and phone.';
  }
  if (context.type === 'company') {
    return 'AI: Next best action: Research company background.';
  }
  return 'AI: Next best action: Review and update.';
} 