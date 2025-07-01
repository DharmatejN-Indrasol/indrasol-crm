import { DataProvider } from 'react-admin';
import { Lead, Sequence, Template, CommunicationLog } from '../../types';

export class AutomationService {
    constructor(private dataProvider: DataProvider) {}

    async processLeadSequence(lead: Lead, sequence: Sequence) {
        if (!lead.sequence_id || !lead.sequence_step) {
            // Initialize sequence
            await this.dataProvider.update('leads', {
                id: lead.id,
                data: {
                    sequence_id: sequence.id,
                    sequence_step: 0,
                    next_follow_up_at: this.calculateNextFollowUp(sequence.steps[0]),
                },
                previousData: lead,
            });
            return;
        }

        // Get current step
        const currentStep = sequence.steps[lead.sequence_step];
        if (!currentStep) {
            // Sequence completed
            await this.dataProvider.update('leads', {
                id: lead.id,
                data: {
                    sequence_id: null,
                    sequence_step: null,
                    next_follow_up_at: null,
                },
                previousData: lead,
            });
            return;
        }

        // Process current step
        await this.executeStep(lead, sequence, currentStep);

        // Move to next step
        const nextStep = sequence.steps[lead.sequence_step + 1];
        await this.dataProvider.update('leads', {
            id: lead.id,
            data: {
                sequence_step: lead.sequence_step + 1,
                next_follow_up_at: nextStep ? this.calculateNextFollowUp(nextStep) : null,
            },
            previousData: lead,
        });
    }

    private calculateNextFollowUp(step: Sequence['steps'][0]): string {
        const now = new Date();
        switch (step.delay_unit) {
            case 'minutes':
                now.setMinutes(now.getMinutes() + step.delay);
                break;
            case 'hours':
                now.setHours(now.getHours() + step.delay);
                break;
            case 'days':
                now.setDate(now.getDate() + step.delay);
                break;
        }
        return now.toISOString();
    }

    private async executeStep(lead: Lead, sequence: Sequence, step: Sequence['steps'][0]) {
        // Get template if specified
        let template: Template | null = null;
        if (step.template_id) {
            const response = await this.dataProvider.getOne('templates', {
                id: step.template_id,
            });
            template = response.data;
        }

        // Execute step based on type
        switch (step.type) {
            case 'email':
                await this.sendEmail(lead, template);
                break;
            case 'sms':
                await this.sendSMS(lead, template);
                break;
            case 'call':
                await this.createCallTask(lead, template);
                break;
            case 'task':
                await this.createTask(lead, template);
                break;
        }

        // Log communication
        await this.logCommunication(lead, sequence, step, template);
    }

    private async sendEmail(lead: Lead, template: Template | null) {
        if (!template) throw new Error('Email template required');
        if (!lead.email) throw new Error('Lead email required');

        const log = await this.logCommunication(lead, {} as any, { type: 'email' } as any, template, 'pending');

        const trackingPixelUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-email?log_id=${log.id}`;
        const trackingPixel = `<img src="${trackingPixelUrl}" width="1" height="1" alt="" />`;

        const content = this.replaceVariables(template.content, lead) + trackingPixel;
        const subject = this.replaceVariables(template.subject || '', lead);

        // TODO: Integrate with email service (e.g., SendGrid, Mailgun)
        console.log('Sending email:', { to: lead.email, subject, content });
        
        // After sending, update the log status
        // In a real scenario, you'd get a message ID from the email provider
        await this.dataProvider.update('communication_logs', {
            id: log.id,
            data: { status: 'sent' },
            previousData: log,
        });
    }

    private async sendSMS(lead: Lead, template: Template | null) {
        if (!template) throw new Error('SMS template required');
        if (!lead.phone) throw new Error('Lead phone required');

        const content = this.replaceVariables(template.content, lead);

        // TODO: Integrate with SMS service (e.g., Twilio)
        console.log('Sending SMS:', { to: lead.phone, content });
    }

    private async createCallTask(lead: Lead, template: Template | null) {
        const script = template ? this.replaceVariables(template.content, lead) : '';

        await this.dataProvider.create('tasks', {
            data: {
                title: `Call ${lead.name}`,
                description: script,
                due_date: new Date().toISOString(),
                type: 'call',
                lead_id: lead.id,
                status: 'pending',
            },
        });
    }

    private async createTask(lead: Lead, template: Template | null) {
        const description = template ? this.replaceVariables(template.content, lead) : '';

        await this.dataProvider.create('tasks', {
            data: {
                title: `Follow up with ${lead.name}`,
                description,
                due_date: new Date().toISOString(),
                type: 'follow_up',
                lead_id: lead.id,
                status: 'pending',
            },
        });
    }

    private async logCommunication(
        lead: Lead,
        sequence: Sequence,
        step: Sequence['steps'][0],
        template: Template | null,
        status: string = 'completed'
    ): Promise<CommunicationLog> {
        const { data } = await this.dataProvider.create('communication_logs', {
            data: {
                lead_id: lead.id,
                type: step.type,
                direction: 'outbound',
                status: status,
                content: template?.content,
                template_id: template?.id,
                sequence_id: sequence.id,
                metadata: {
                    step_index: lead.sequence_step,
                    variables: this.extractVariables(lead),
                },
            },
        });
        return data;
    }

    private replaceVariables(content: string, lead: Lead): string {
        const variables = this.extractVariables(lead);
        return content.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
            return variables[variable] || match;
        });
    }

    private extractVariables(lead: Lead): Record<string, string> {
        return {
            name: lead.name,
            first_name: lead.name.split(' ')[0],
            last_name: lead.name.split(' ').slice(1).join(' '),
            email: lead.email || '',
            phone: lead.phone || '',
            company_id: String(lead.company_id) || '',
            ...lead.metadata,
        };
    }
}

// Singleton instance
let automationService: AutomationService | null = null;

export const getAutomationService = (dataProvider: DataProvider): AutomationService => {
    if (!automationService) {
        automationService = new AutomationService(dataProvider);
    }
    return automationService;
}; 